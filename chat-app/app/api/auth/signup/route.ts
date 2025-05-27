import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

interface SignupRequestBody {
  username: string;
  password: string;
  profilePicture?: string;
}

export async function POST(request: Request) {
  try {
    const { username, password, profilePicture }: SignupRequestBody = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Normalize and validate username
    const normalizedUsername = username.toLowerCase();
    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return NextResponse.json(
        { message: 'Username must be 3-20 characters long' },
        { status: 400 }
      );
    }

    // Check for existing username
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate profile picture (if provided)
    let profilePictureBuffer: Buffer | undefined;
    if (profilePicture) {
      if (!/^data:image\/(png|jpeg|jpg);base64,/.test(profilePicture)) {
        return NextResponse.json(
          { message: 'Profile picture must be a PNG or JPEG image' },
          { status: 400 }
        );
      }

      const base64Data = profilePicture.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: 'Profile picture must be less than 5MB' },
          { status: 400 }
        );
      }
      profilePictureBuffer = buffer;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        profilePicture: profilePictureBuffer,
      },
      select: { id: true, username: true },
    });

    return NextResponse.json(
      { message: 'Signup successful', user },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      //@ts-ignore
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      //@ts-ignore
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Username already exists' },
          { status: 400 }
        );
      }
      //@ts-ignore
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
      //@ts-ignore
      username,
    });

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}