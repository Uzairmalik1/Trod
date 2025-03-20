const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixClipPaths() {
  console.log('Starting to fix clip paths...');
  
  try {
    // Get all clips
    const clips = await prisma.clip.findMany({
      include: {
        video: true
      }
    });
    
    console.log(`Found ${clips.length} clips to process`);
    
    // Track statistics
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each clip
    for (const clip of clips) {
      try {
        // Check if this is a vertical clip (has resizedUrl or resizedPath)
        if (!clip.resizedUrl && !clip.resizedPath) {
          console.log(`Skipping clip ${clip.id} - no vertical version`);
          skippedCount++;
          continue;
        }
        
        // Extract clip index and times from filename
        const match = clip.id.match(/clip-.*-(\d+)$/);
        if (!match) {
          console.log(`Skipping clip ${clip.id} - unable to parse clip index from ID`);
          skippedCount++;
          continue;
        }
        
        const clipIndex = parseInt(match[1], 10);
        const startTime = clip.startTime;
        const endTime = clip.endTime;
        
        // Construct the correct vertical filename
        const verticalFileName = `vertical_clip_${clipIndex}_${startTime}s_to_${endTime}s.mp4`;
        
        // Construct the base path (without the filename)
        const baseDir = path.dirname(clip.video.originalUrl || '');
        const userId = clip.video.userId;
        const videoIdMatch = clip.video.id.match(/^(.+)$/);
        
        if (!baseDir || !userId || !videoIdMatch) {
          console.log(`Skipping clip ${clip.id} - missing required path components`);
          skippedCount++;
          continue;
        }
        
        // Construct the correct vertical URL
        const videoPath = clip.video.originalUrl?.split('/original.mp4')[0] || '';
        if (!videoPath) {
          console.log(`Skipping clip ${clip.id} - can't extract video path`);
          skippedCount++;
          continue;
        }
        
        const correctResizedUrl = `${videoPath}/clips/vertical/${verticalFileName}`;
        
        // Construct the correct file path
        const publicDir = path.join(process.cwd(), 'public');
        const relativePath = correctResizedUrl.startsWith('/') ? correctResizedUrl.substring(1) : correctResizedUrl;
        const correctResizedPath = path.join(publicDir, relativePath);
        
        // Check if the file exists
        const fileExists = fs.existsSync(correctResizedPath);
        if (!fileExists) {
          console.log(`Skipping clip ${clip.id} - vertical file does not exist at ${correctResizedPath}`);
          skippedCount++;
          continue;
        }
        
        // Update the clip with correct paths
        await prisma.clip.update({
          where: { id: clip.id },
          data: {
            resizedUrl: correctResizedUrl,
            resizedPath: correctResizedPath
          }
        });
        
        console.log(`Updated clip ${clip.id} with correct paths`);
        console.log(`  Old URL: ${clip.resizedUrl}`);
        console.log(`  New URL: ${correctResizedUrl}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error processing clip ${clip.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nClip path fixing completed:');
    console.log(`Total clips: ${clips.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error fixing clip paths:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixClipPaths().catch(console.error); 