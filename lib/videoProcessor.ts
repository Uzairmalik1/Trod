import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { createVideoPaths } from './fileStorage';

const prisma = new PrismaClient();

/**
 * Generate a thumbnail URL from a video path
 */
function generateThumbnailUrl(videoUrl: string) {
  // Convert from /uploads/... to /thumbnails/...
  return videoUrl.replace('/uploads/', '/thumbnails/');
}

/**
 * Get the appropriate Python executable path based on the current environment
 */
function getPythonExecutablePath(venvPath: string): string {
  // Check if we're in a Docker/Linux environment
  const isLinux = process.platform === 'linux' || process.env.CONTAINER === 'true';
  
  if (isLinux) {
    // In Linux/Docker, Python executable is at /usr/bin/python3
    return '/usr/bin/python3';
  } else {
    // In Windows, it's in the venv Scripts directory
    return path.join(venvPath, 'Scripts', 'python.exe');
  }
}

/**
 * Process a video to extract clips using the Python script
 */
export async function processVideoFile(videoId: string, options: any = {}) {
  try {
    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { user: true }
    });
    
    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }
    
    // Update video status
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'processing' }
    });
    
    // Create processing job
    const processingJob = await prisma.processingJob.create({
      data: {
        type: 'video-processing',
        status: 'processing',
        parameters: options,
        startedAt: new Date()
      }
    });
    
    // Get video paths
    const paths = createVideoPaths(video.userId, video.id, video.title);
    
    // Prepare paths
    const scriptPath = path.join(process.cwd(), 'scripts', 'clip.py');
    const venvPath = path.join(process.cwd(), 'scripts', 'venv');
    const pythonPath = getPythonExecutablePath(venvPath);
    
    // In Docker/Linux environment, the site-packages path is different
    const isLinux = process.platform === 'linux' || process.env.CONTAINER === 'true';
    const sitePackagesPath = isLinux 
      ? '/usr/lib/python3.11/site-packages' // Adjust version if needed
      : path.join(venvPath, 'Lib', 'site-packages');
    
    // Debug information about paths
    console.log('Debug - Paths:');
    console.log('Working Directory:', process.cwd());
    console.log('Script Path:', scriptPath);
    console.log('Python Path:', pythonPath);
    console.log('Site Packages:', sitePackagesPath);
    console.log('Environment:', process.platform, isLinux ? 'Docker/Linux' : 'Windows');
    
    // Ensure paths exist
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found at: ${scriptPath}`);
    }
    
    // Only check for Python if not in Docker (in Docker we use system Python)
    if (!isLinux && !fs.existsSync(pythonPath)) {
      throw new Error(`Python executable not found at: ${pythonPath}`);
    }
    
    // Skip site packages check in Docker environment
    if (!isLinux && !fs.existsSync(sitePackagesPath)) {
      throw new Error(`Site packages not found at: ${sitePackagesPath}`);
    }
    
    if (!fs.existsSync(paths.originalPath)) {
      throw new Error(`Video file not found at: ${paths.originalPath}`);
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(paths.clipsDir)) {
      fs.mkdirSync(paths.clipsDir, { recursive: true });
    }
    
    // Set up environment variables for Python
    const env = {
      ...process.env,
      PYTHONPATH: sitePackagesPath,
      VIRTUAL_ENV: venvPath,
      PATH: `${path.dirname(pythonPath)}${path.delimiter}${process.env.PATH}`,
      CONTAINER: 'true',
    };
    
    const args = [
      scriptPath,
      '--video', paths.originalPath,
      '--output-dir', paths.clipsDir,
      '--resize',
      '--token', process.env.HUGGING_FACE_TOKEN || '',
    ];
    
    // Debug command and environment
    console.log('Debug - Command:', pythonPath, args.join(' '));
    console.log('Debug - Environment:');
    console.log('PYTHONPATH:', env.PYTHONPATH);
    console.log('VIRTUAL_ENV:', env.VIRTUAL_ENV);
    console.log('PATH:', env.PATH);
    
    // Create log file for processing output
    const logPath = path.join(paths.videoDir, 'processing_log.txt');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    
    // Log debug information
    logStream.write(`=== Debug Information ===\n`);
    logStream.write(`Timestamp: ${new Date().toISOString()}\n`);
    logStream.write(`Working Directory: ${process.cwd()}\n`);
    logStream.write(`Python Path: ${pythonPath}\n`);
    logStream.write(`Script Path: ${scriptPath}\n`);
    logStream.write(`Site Packages: ${sitePackagesPath}\n`);
    logStream.write(`Environment: ${process.platform}, ${isLinux ? 'Docker/Linux' : 'Windows'}\n`);
    logStream.write(`Environment Variables:\n`);
    logStream.write(`PYTHONPATH=${env.PYTHONPATH}\n`);
    logStream.write(`VIRTUAL_ENV=${env.VIRTUAL_ENV}\n`);
    logStream.write(`PATH=${env.PATH}\n\n`);
    logStream.write(`=== Starting Processing ===\n`);
    logStream.write(`Command: ${pythonPath} ${args.join(' ')}\n\n`);
    
    // First, try to list installed packages
    console.log('Debug - Checking installed packages...');
    const pipProcess = spawn(pythonPath, ['-m', 'pip', 'list'], { env });
    
    pipProcess.stdout.on('data', (data) => {
      console.log('Installed packages:', data.toString());
      logStream.write(`[pip list] ${data.toString()}`);
    });
    
    pipProcess.stderr.on('data', (data) => {
      console.error('Pip error:', data.toString());
      logStream.write(`[pip error] ${data.toString()}`);
    });
    
    await new Promise((resolve) => pipProcess.on('close', resolve));
    
    // Spawn process with virtual environment
    const pythonProcess = spawn(pythonPath, args, { env });
    
    // Collect output and error streams
    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString();
      console.log('Python stdout:', message);
      logStream.write(`[stdout] ${message}`);
      
      // Update progress if possible by parsing the output
      if (message.includes('Extracting clip')) {
        const match = message.match(/(\d+)\/(\d+)/);
        if (match) {
          const [current, total] = match.slice(1).map(Number);
          const progress = (current / total) * 100;
          updateProgress(processingJob.id, progress);
        }
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString();
      console.error('Python stderr:', message);
      logStream.write(`[stderr] ${message}`);
    });
    
    // Handle process completion
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        logStream.write(`\nProcess exited with code ${code} at ${new Date().toISOString()}\n`);
        logStream.end();
        
        if (code === 0) {
          // Process completed successfully
          // Scan the clips directory and create entries in the database
          const clipFiles = fs.readdirSync(paths.clipsDir)
            .filter(file => file.endsWith('.mp4') && file.startsWith('clip_'));
          
          console.log(`Found ${clipFiles.length} clip files in ${paths.clipsDir}`);
          const createdClips = [];
          
          for (const clipFile of clipFiles) {
            // Parse clip data from filename (e.g., clip_1_10s_to_20s.mp4)
            const match = clipFile.match(/clip_(\d+)_(\d+)s_to_(\d+)s\.mp4/);
            if (match) {
              const [_, clipIndex, startTime, endTime] = match.map(Number);
              
              // Create clip ID
              const clipId = `clip-${videoId}-${clipIndex}`;
              
              // Check for SRT file
              const srtFile = clipFile.replace('.mp4', '.srt');
              const hasSrt = fs.existsSync(path.join(paths.clipsDir, srtFile));
              
              // Check for vertical version
              const verticalFileName = `vertical_clip_${clipIndex}_${startTime}s_to_${endTime}s.mp4`;
              const verticalFilePath = path.join(paths.verticalDir, verticalFileName);
              const hasVertical = fs.existsSync(verticalFilePath);
              
              // Generate correct URLs based on actual file names
              const clipUrl = `/uploads/${video.userId}/${path.basename(paths.videoDir)}/clips/${clipFile}`;
              const subtitlesUrl = hasSrt ? `/uploads/${video.userId}/${path.basename(paths.videoDir)}/clips/${srtFile}` : null;
              const subtitlesPath = hasSrt ? path.join(paths.clipsDir, srtFile) : null;
              
              // Use the actual file paths for vertical clips
              const resizedUrl = hasVertical 
                ? `/uploads/${video.userId}/${path.basename(paths.videoDir)}/clips/vertical/${verticalFileName}`
                : null;
              const resizedPath = hasVertical ? verticalFilePath : null;
              
              // Create clip record
              const clip = await prisma.clip.create({
                data: {
                  id: clipId,
                  videoId: video.id,
                  title: `Clip ${clipIndex} from ${video.title}`,
                  startTime: parseInt(startTime.toString(), 10),
                  endTime: parseInt(endTime.toString(), 10),
                  url: clipUrl,
                  filePath: path.join(paths.clipsDir, clipFile),
                  thumbnailUrl: hasVertical && resizedUrl ? generateThumbnailUrl(resizedUrl) : generateThumbnailUrl(clipUrl),
                  subtitlesUrl,
                  subtitlesPath,
                  resizedUrl,
                  resizedPath,
                  processingJobId: processingJob.id
                }
              });
              
              createdClips.push(clip);
            }
          }
          
          // Update video and processing job
          await prisma.video.update({
            where: { id: videoId },
            data: { 
              status: 'completed',
              processedAt: new Date()
            }
          });
          
          await prisma.processingJob.update({
            where: { id: processingJob.id },
            data: {
              status: 'completed',
              finishedAt: new Date(),
              progress: 100,
              logs: fs.readFileSync(logPath, 'utf-8')
            }
          });
          
          resolve({
            video,
            clips: createdClips,
            processingJob
          });
        } else {
          // Process failed
          console.error(`Video processing error: Process exited with code ${code}`);
          
          await prisma.video.update({
            where: { id: videoId },
            data: {
              status: 'failed',
              error: `Processing failed with exit code ${code}`
            }
          });
          
          await prisma.processingJob.update({
            where: { id: processingJob.id },
            data: {
              status: 'failed',
              finishedAt: new Date(),
              logs: fs.readFileSync(logPath, 'utf-8'),
              error: `Processing failed with exit code ${code}`
            }
          });
          
          reject(`Processing failed with exit code ${code}`);
        }
      });
      
      pythonProcess.on('error', async (err) => {
        console.error('Video processing error:', err);
        logStream.write(`\nProcess error: ${err.message} at ${new Date().toISOString()}\n`);
        logStream.end();
        
        await prisma.video.update({
          where: { id: videoId },
          data: {
            status: 'failed',
            error: err.message
          }
        });
        
        await prisma.processingJob.update({
          where: { id: processingJob.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            logs: fs.readFileSync(logPath, 'utf-8'),
            error: err.message
          }
        });
        
        reject(err);
      });
    });
  } catch (error: any) {
    console.error('Video processing error:', error);
    
    // Update video status
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'failed',
        error: error.message
      }
    });
    
    throw error;
  }
}

/**
 * Update progress for a processing job
 */
async function updateProgress(jobId: string, progress: number) {
  try {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { progress }
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
} 