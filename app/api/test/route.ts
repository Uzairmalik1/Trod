import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    const testCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount: testCount
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: error.message || 'Database connection failed',
      stack: error.stack 
    }, { status: 500 });
  }
} 