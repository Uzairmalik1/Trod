import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function fixClipUrls() {
  try {
    console.log('Starting clip URL verification and fix...');
    
    // Get all clips
    const clips = await prisma.clip.findMany({
      include: {
        video: true
      }
    });
    
    console.log(`Found ${clips.length} clips to process`);
    
    for (const clip of clips) {
      const videoDir = path.dirname(clip.video.uploadPath);
      const expectedClipsDir = path.join(videoDir, 'clips');
      
      // Fix main clip URL
      if (clip.url) {
        const fileName = path.basename(clip.url);
        const expectedPath = path.join('uploads', clip.video.userId, path.basename(videoDir), 'clips', fileName);
        const fullPath = path.join(process.cwd(), 'public', expectedPath);
        
        if (fs.existsSync(fullPath) && clip.url !== expectedPath) {
          console.log(`Fixing clip URL for ${clip.id}:`);
          console.log(`  Old: ${clip.url}`);
          console.log(`  New: ${expectedPath}`);
          
          await prisma.clip.update({
            where: { id: clip.id },
            data: { 
              url: expectedPath,
              filePath: fullPath
            }
          });
        }
      }
      
      // Fix resized clip URL
      if (clip.resizedUrl) {
        const fileName = path.basename(clip.resizedUrl);
        const expectedPath = path.join('uploads', clip.video.userId, path.basename(videoDir), 'clips', 'vertical', fileName);
        const fullPath = path.join(process.cwd(), 'public', expectedPath);
        
        if (fs.existsSync(fullPath) && clip.resizedUrl !== expectedPath) {
          console.log(`Fixing resized URL for ${clip.id}:`);
          console.log(`  Old: ${clip.resizedUrl}`);
          console.log(`  New: ${expectedPath}`);
          
          await prisma.clip.update({
            where: { id: clip.id },
            data: { 
              resizedUrl: expectedPath,
              resizedPath: fullPath
            }
          });
        }
      }
      
      // Fix subtitles URL
      if (clip.subtitlesUrl) {
        const fileName = path.basename(clip.subtitlesUrl);
        const expectedPath = path.join('uploads', clip.video.userId, path.basename(videoDir), 'clips', fileName);
        const fullPath = path.join(process.cwd(), 'public', expectedPath);
        
        if (fs.existsSync(fullPath) && clip.subtitlesUrl !== expectedPath) {
          console.log(`Fixing subtitles URL for ${clip.id}:`);
          console.log(`  Old: ${clip.subtitlesUrl}`);
          console.log(`  New: ${expectedPath}`);
          
          await prisma.clip.update({
            where: { id: clip.id },
            data: { 
              subtitlesUrl: expectedPath,
              subtitlesPath: fullPath
            }
          });
        }
      }
    }
    
    console.log('Finished processing clips');
  } catch (error) {
    console.error('Error fixing clip URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClipUrls(); 