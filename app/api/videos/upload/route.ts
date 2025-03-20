import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createVideoPaths, initializeUploadDirectory, ensureDir } from '@/lib/fileStorage';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// Initialize the upload directory at startup
initializeUploadDirectory();

// Create a default user if not exists
let defaultUserId: string;

async function ensureDefaultUser() {
  try {
    // Try to find a default test user
    let defaultUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    });
    
    // If no user exists, create one
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });
      console.log('Created default test user:', defaultUser.id);
    }
    
    defaultUserId = defaultUser.id;
    return defaultUser.id;
  } catch (error) {
    console.error('Error ensuring default user exists:', error);
    throw error;
  }
}

// Initialize the default user when this module is loaded
ensureDefaultUser().catch(console.error);

export async function POST(request: NextRequest) {
  try {
    console.log("Video upload request received");
    
    // Get the authenticated user
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      console.error("No authenticated user found");
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      console.error("User has no email");
      return NextResponse.json({ error: 'Invalid user account' }, { status: 400 });
    }
    
    // Get or create the user in our database
    let user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    // If user doesn't exist in our database yet, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: session.user.name || userEmail.split('@')[0],
          profileImage: session.user.image || undefined
        }
      });
      console.log(`Created new user in database: ${user.id}`);
    }
    
    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error("No file provided in the request");
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`File received: ${file.name}, size: ${file.size}`);
    
    try {
      // Create video record in database
      const video = await prisma.video.create({
        data: {
          userId: user.id,
          title: title || file.name,
          description,
          originalUrl: '',
          fileSize: file.size,
          duration: 0,
          status: 'uploading',
          uploadPath: ''
        }
      });
      
      console.log(`Video record created in database with ID: ${video.id}`);
      
      // Create file system paths
      const paths = createVideoPaths(user.id, video.id, video.title);
      
      // Make sure the upload directory exists
      ensureDir(path.dirname(paths.originalPath));
      
      // Save file to disk
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(paths.originalPath, buffer);
        
        console.log(`File saved to: ${paths.originalPath}`);
        
        // Verify the file was written
        if (!fs.existsSync(paths.originalPath)) {
          throw new Error(`File was not saved to ${paths.originalPath}`);
        }
        
        // Update video record with file paths
        await prisma.video.update({
          where: { id: video.id },
          data: {
            originalUrl: paths.originalUrl,
            uploadPath: paths.originalPath,
            status: 'uploaded'
          }
        });
        
        console.log(`Video record updated with file paths`);
        
        // Return success response
        return NextResponse.json({
          success: true,
          video: {
            id: video.id,
            title: video.title,
            originalUrl: paths.originalUrl,
            status: 'uploaded'
          }
        });
      } catch (fileError: any) {
        console.error(`Error saving file: ${fileError.message}`);
        // Update the video status to failed
        await prisma.video.update({
          where: { id: video.id },
          data: { status: 'failed' }
        });
        throw new Error(`Error saving file: ${fileError.message}`);
      }
    } catch (dbError: any) {
      console.error(`Database error: ${dbError.message}`);
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error: any) {
    console.error(`Upload error: ${error.message}`, error.stack);
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      stack: error.stack
    }, { status: 500 });
  }
} 