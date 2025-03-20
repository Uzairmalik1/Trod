import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    return NextResponse.json({
      success: true,
      message: 'Database users retrieved successfully',
      count: users.length,
      users: users.map(u => ({ id: u.id, email: u.email, name: u.name }))
    });
  } catch (error: any) {
    console.error('Database user error:', error);
    return NextResponse.json({ 
      error: error.message || 'Database user operation failed',
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || 'Test User',
        password: 'test-password' // In a real app, this would be hashed
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error: any) {
    console.error('Database user creation error:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Database user creation failed',
      stack: error.stack 
    }, { status: 500 });
  }
} 