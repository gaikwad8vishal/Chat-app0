import { NextResponse } from 'next/server';

const users: { username: string; password: string }[] = [];

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = users.find(
      (user) => user.username === username && user.password === password
    );
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ message: 'Signin successful' }, { status: 200 });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}