import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication will be added later
    
    const videoId = params.id;
    
    // Get video and clips
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { 
        clips: {
          orderBy: { startTime: 'asc' }
        }
      }
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      videoId,
      status: video.status,
      clips: video.clips
    });
  } catch (error: any) {
    console.error('Error fetching clips:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch clips' }, { status: 500 });
  }
} 