import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all videos for the current user with their clips
    const videos = await prisma.video.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        clips: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    
    // Calculate clip count for each video
    const videosWithClipCount = videos.map(video => ({
      ...video,
      clipCount: video.clips.length,
      clips: video.clips.map(clip => ({
        ...clip,
        createdAt: clip.createdAt.toISOString(),
      })),
      uploadedAt: video.uploadedAt.toISOString(),
      processedAt: video.processedAt ? video.processedAt.toISOString() : null,
    }));
    
    return NextResponse.json({
      success: true,
      videos: videosWithClipCount,
    });
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch videos' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 