import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET route to list all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST route to create a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const existingUser = await prisma.user.findFirst({
      where: { email: body.email }
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        message: 'User with this email already exists',
        user: existingUser
      }, { status: 200 });
    }
    
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name || 'Default User'
      }
    });
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 