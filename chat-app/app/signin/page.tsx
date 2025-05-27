'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import { Input } from '@/app/ui/input';

export default function Signin() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      router.push('/');
    }
  }, [router]);

  const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true);

    // Validate input
    if (!username || !password) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store username in session storage for use in the chat page
        sessionStorage.setItem('username', username);
        // Keep loading state true during navigation to show "Redirecting..."
        router.push('/');
      } else {
        setError(data.message || 'Signin failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Signin error:', err);
      setError('Network error. Please try again later.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Signin</h1>
        {error && (
          <p id="error-message" className="text-red-500 text-center">
            {error}
          </p>
        )}
        <form onSubmit={handleSignin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              placeholder="Enter your username"
              required
              disabled={isLoading}
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
                disabled={isLoading}
                aria-describedby={error ? 'error-message' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500"
                disabled={isLoading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Redirecting...' : 'Signin'}
          </Button>
        </form>
        <div className="text-center text-sm space-y-2">
          <p>
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-primary hover:underline">
              Signup
            </a>
          </p>
          <p>
            <a href="/forgot-password" className="text-primary hover:underline">
              Forgot Password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}