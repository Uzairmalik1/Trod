import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Log the clip ID we're trying to fetch
    console.log('Fetching clip with ID:', id);
    
    // Get auth session but don't use it yet (commented out for debugging)
    const _session = await auth(); // Add underscore to show it's intentionally unused
    
    // Temporarily disable authentication requirement for debugging
    // if (!session || !session.user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    
    // Find the clip with the given ID
    const clip = await prisma.clip.findUnique({
      where: {
        id: id,
      },
      include: {
        video: {
          select: {
            userId: true,
            title: true,
          },
        },
      },
    });
    
    // Check if clip exists
    if (!clip) {
      console.log('Clip not found with ID:', id);
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      );
    }
    
    // Temporarily disable authorization check for debugging
    // Check if the user owns the video
    // if (session?.user && clip.video.userId !== session.user.id) {
    //   console.log('User unauthorized. Video owner:', clip.video.userId, 'Current user:', session.user.id);
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 403 }
    //   );
    // }
    
    // Remove the video relation from the response
    const { video, ...clipData } = clip;
    
    // Log subtitles path if available
    if (clipData.subtitlesUrl) {
      console.log('Subtitles URL from database:', clipData.subtitlesUrl);
      
      // Convert URL to filesystem path
      const publicDir = path.join(process.cwd(), 'public');
      const subtitlesPath = path.join(publicDir, clipData.subtitlesUrl);
      console.log('Checking subtitles at path:', subtitlesPath);
      
      // Check if the file exists
      const exists = fs.existsSync(subtitlesPath);
      console.log(`Subtitles file exists at path: ${exists}`);
      
      if (!exists) {
        // Try alternative paths
        const dirPath = path.dirname(subtitlesPath);
        console.log(`Looking for subtitle files in directory: ${dirPath}`);
        
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          const srtFiles = files.filter((file: string) => file.endsWith('.srt'));
          
          if (srtFiles.length > 0) {
            console.log(`Found ${srtFiles.length} SRT files in directory:`, srtFiles);
            // Update the subtitles URL to use the found file
            const relativePath = path.relative(publicDir, path.join(dirPath, srtFiles[0]));
            clipData.subtitlesUrl = '/' + relativePath.replace(/\\/g, '/');
            console.log('Updated subtitles URL to:', clipData.subtitlesUrl);
          } else {
            console.log('No SRT files found in directory');
            clipData.subtitlesUrl = null; // Clear the URL if no file found
          }
        } else {
          console.log('Directory does not exist');
          clipData.subtitlesUrl = null; // Clear the URL if directory doesn't exist
        }
      }
    } else {
      console.log('No subtitles URL found for this clip');
    }
    
    console.log('Clip data being returned:', {
      ...clipData,
      videoTitle: video.title,
      filePath: clipData.filePath || null,
      resizedPath: clipData.resizedPath || null
    });
    
    return NextResponse.json({ 
      clip: {
        ...clipData,
        videoTitle: video.title,
        filePath: clipData.filePath || null,
        resizedPath: clipData.resizedPath || null
      } 
    });
  } catch (error) {
    console.error('Error fetching clip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 