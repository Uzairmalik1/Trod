import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { auth } from '@/auth';

// Define upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'debug');

// Function to ensure directory exists
async function ensureDirectoryExists(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error: any) {
    // Check if directory exists after error
    // This handles race conditions where directory might be created between check and creation
    if (!fs.existsSync(dir)) {
      throw new Error(`Failed to create directory ${dir}: ${error.message}`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Debug upload request received");
    
    // Get the authenticated user
    const session = await auth();
    
    // For debug endpoint, we'll allow uploads even without authentication
    // but we'll log the status to help diagnose auth issues
    if (!session || !session.user) {
      console.log("Debug upload: No authenticated user found");
    } else {
      console.log(`Debug upload: Authenticated as ${session.user.email}`);
    }
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error("No file provided in debug request");
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`Debug file received: ${file.name}, size: ${file.size}`);
    
    // Ensure upload directory exists
    await ensureDirectoryExists(UPLOAD_DIR);
    
    // Create a simple file path with user info if available
    const userPrefix = session?.user?.email ? 
      `${session.user.email.split('@')[0]}-` : '';
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(UPLOAD_DIR, `debug-${userPrefix}${Date.now()}-${safeFileName}`);
    
    try {
      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      console.log(`Debug file saved to: ${filePath}`);
      
      // Verify the file was written
      if (!fs.existsSync(filePath)) {
        throw new Error(`Debug file was not saved to ${filePath}`);
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Debug file upload successful',
        filePath: filePath.replace(process.cwd(), ''),
        fileName: file.name,
        fileSize: file.size,
        authenticated: !!session?.user,
        userEmail: session?.user?.email || null
      });
    } catch (fileError: any) {
      console.error(`Debug file save error: ${fileError.message}`);
      throw new Error(`Debug file save error: ${fileError.message}`);
    }
  } catch (error: any) {
    console.error(`Debug upload error: ${error.message}`, error.stack);
    return NextResponse.json({ 
      error: error.message || 'Debug upload failed',
      stack: error.stack
    }, { status: 500 });
  }
} 