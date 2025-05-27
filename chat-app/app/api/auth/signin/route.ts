import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

interface SigninRequestBody {
  username: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { username, password }: SigninRequestBody = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Normalize and trim username, trim password
    const normalizedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();



    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true, username: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }


    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Return success response (excluding the password)
    return NextResponse.json(
      { message: 'Signin successful', user: { id: user.id, username: user.username } },
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

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}