'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import { Input } from '@/app/ui/input';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate terms and conditions
    if (!agreeTerms) {
      setError('You must agree to the Terms and Conditions');
      return;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      // Redirect to signin page after successful signup
      router.push('/signin');
    } else {
      setError(data.message || 'Signup failed');
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center">Signup</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms and Conditions
              </a>
            </label>
          </div>
          <Button type="submit" className="w-full">
            Signup
          </Button>
        </form>
        <p className="text-center text-sm">
          Already have an account?{' '}
          <a href="/signin" className="text-primary hover:underline">
            Signin
          </a>
        </p>
      </div>
    </div>
  );
}