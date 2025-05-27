import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }

    // Normalize username to match signup/signin behavior
    const normalizedUsername = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        username: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Convert profilePicture Buffer to base64 string
    const profilePictureBase64 = user.profilePicture
      ? Buffer.from(user.profilePicture).toString('base64')
      : null;

    return NextResponse.json(
      {
        user: {
          username: user.username,
          profilePicture: profilePictureBase64,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
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

    console.error('Fetch user error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      username: username || 'unknown',
    });

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}