import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

interface SignupRequestBody {
  username: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { username, password }: SignupRequestBody = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength (optional, adjust as needed)
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Normalize username
    const normalizedUsername = username.toLowerCase();

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
      },
      select: { id: true, username: true },
    });

    // Return success response
    return NextResponse.json(
      { message: 'Signup successful', user: { id: user.id, username: user.username } },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P1001') {
        return NextResponse.json(
          { message: 'Database connection error. Please try again later.' },
          { status: 503 }
        );
      }
      console.error('Prisma error:', error);
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { message: 'Database initialization error. Please try again later.' },
        { status: 500 }
      );
    }

    console.error('Signup error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      username,
    });

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}