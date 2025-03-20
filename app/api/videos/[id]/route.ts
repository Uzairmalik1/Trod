import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Get the video with its clips
    const video = await prisma.video.findUnique({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        clips: true,
      },
    });
    
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }
    
    // Format dates
    const formattedVideo = {
      ...video,
      clips: video.clips.map(clip => ({
        ...clip,
        createdAt: clip.createdAt.toISOString(),
      })),
      uploadedAt: video.uploadedAt.toISOString(),
      processedAt: video.processedAt ? video.processedAt.toISOString() : null,
    };
    
    return NextResponse.json({
      success: true,
      video: formattedVideo,
    });
  } catch (error: any) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
} 