import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
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

    // Convert profilePicture (Bytes) to base64 string
    const profilePictureBase64 = user.profilePicture
      ? Buffer.from(user.profilePicture).toString('base64')
      : null;

    return NextResponse.json(
      {
        user: {
          username: user.username,
          profilePicture: profilePictureBase64, // Send as base64
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}