import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Base upload directory
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Ensures a directory exists, creating it if necessary
 */
export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates storage paths for a video and its clips
 */
export function createVideoPaths(userId: string, videoId: string, videoTitle: string) {
  // Sanitize title for filesystem
  const sanitizedTitle = videoTitle
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .substring(0, 50); // Limit length
  
  // Create directory structure
  const userDir = path.join(UPLOAD_BASE_DIR, userId);
  const videoDir = path.join(userDir, `${sanitizedTitle}-${videoId}`);
  const clipsDir = path.join(videoDir, 'clips');
  const verticalDir = path.join(clipsDir, 'vertical');
  
  // Ensure all directories exist
  ensureDir(userDir);
  ensureDir(videoDir);
  ensureDir(clipsDir);
  ensureDir(verticalDir);
  
  // Return path information
  return {
    userDir,
    videoDir,
    clipsDir,
    verticalDir,
    originalPath: path.join(videoDir, 'original.mp4'),
    thumbnailPath: path.join(videoDir, 'thumbnail.jpg'),
    transcriptionPath: path.join(videoDir, 'transcription.json'),
    
    // URL paths (relative to public directory)
    originalUrl: `/uploads/${userId}/${sanitizedTitle}-${videoId}/original.mp4`,
    thumbnailUrl: `/uploads/${userId}/${sanitizedTitle}-${videoId}/thumbnail.jpg`,
    
    // Clip path generators
    getClipPath: (clipId: string) => path.join(clipsDir, `${clipId}.mp4`),
    getClipUrl: (clipId: string) => `/uploads/${userId}/${sanitizedTitle}-${videoId}/clips/${clipId}.mp4`,
    
    getClipThumbnailPath: (clipId: string) => path.join(clipsDir, `${clipId}.jpg`),
    getClipThumbnailUrl: (clipId: string) => `/uploads/${userId}/${sanitizedTitle}-${videoId}/clips/${clipId}.jpg`,
    
    getClipSubtitlesPath: (clipId: string) => path.join(clipsDir, `${clipId}.srt`),
    getClipSubtitlesUrl: (clipId: string) => `/uploads/${userId}/${sanitizedTitle}-${videoId}/clips/${clipId}.srt`,
    
    // Vertical clip paths - match actual file naming pattern
    getVerticalClipPath: (index: number, startTime: number, endTime: number) => 
      path.join(verticalDir, `vertical_clip_${index}_${startTime}s_to_${endTime}s.mp4`),
    getVerticalClipUrl: (index: number, startTime: number, endTime: number) => 
      `/uploads/${userId}/${sanitizedTitle}-${videoId}/clips/vertical/vertical_clip_${index}_${startTime}s_to_${endTime}s.mp4`,

    // Legacy format support
    getLegacyVerticalClipPath: (clipId: string) => path.join(verticalDir, `${clipId}.mp4`),
    getLegacyVerticalClipUrl: (clipId: string) => `/uploads/${userId}/${sanitizedTitle}-${videoId}/clips/vertical/${clipId}.mp4`,
  };
}

/**
 * Generates a thumbnail from a video using FFmpeg
 */
export async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-ss', '00:00:05', // 5 seconds into the video
      '-frames:v', '1',
      '-q:v', '2',
      thumbnailPath
    ]);

    ffmpeg.on('close', (code: number) => {
      resolve(code === 0);
    });
  });
}

/**
 * Creates public/uploads directory if it doesn't exist
 */
export function initializeUploadDirectory() {
  ensureDir(UPLOAD_BASE_DIR);
  console.log(`Upload directory initialized at: ${UPLOAD_BASE_DIR}`);
} 