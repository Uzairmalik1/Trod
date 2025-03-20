import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processVideoFile } from '@/lib/videoProcessor';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const session = await auth();
    
    // Check authentication
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Get and validate video ID
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }
    
    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Check if the user owns this video
    if (video.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Not authorized to process this video' }, { status: 403 });
    }
    
    // Start processing in the background
    processVideoFile(id)
      .catch(error => {
        console.error('Processing error:', error);
      });
    
    // Return immediate response
    return NextResponse.json({
      success: true,
      message: 'Processing started',
      videoId: id
    });
  } catch (error: any) {
    console.error('Error processing video:', error);
    return NextResponse.json({ error: error.message || 'Failed to process video' }, { status: 500 });
  }
} 