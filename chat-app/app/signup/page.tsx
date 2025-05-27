'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import { Input } from '@/app/ui/input';

// Define interface for API response
interface SignupResponse {
  message: string;
}

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    } else {
      setProfilePicture(null);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate terms and conditions
    if (!agreeTerms) {
      setError('You must agree to the Terms and Conditions');
      setIsLoading(false);
      return;
    }

    try {
      let profilePictureBase64: string | null = null;

      // Convert profile picture to base64 if provided
      if (profilePicture) {
        const arrayBuffer = await profilePicture.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileType = profilePicture.type; // e.g., image/jpeg
        const base64String = buffer.toString('base64');

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(fileType)) {
          setError('Only JPEG, PNG, and GIF images are allowed');
          setIsLoading(false);
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (profilePicture.size > maxSize) {
          setError('Profile picture must be less than 5MB');
          setIsLoading(false);
          return;
        }

        // Add data URI prefix for server compatibility
        profilePictureBase64 = `data:${fileType};base64,${base64String}`;
      }

      // Send signup request
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, profilePicture: profilePictureBase64 }),
      });

      const data: SignupResponse = await response.json();

      if (response.ok) {
        router.push('/signin');
      } else {
        // Map server-side errors to user-friendly messages
        switch (data.message) {
          case 'Username already exists':
            setError('This username is already taken');
            break;
          case 'Invalid profile picture format. Must be a base64-encoded image':
            setError('Invalid profile picture format');
            break;
          case 'Profile picture must be less than 5MB':
            setError('Profile picture is too large (max 5MB)');
            break;
          case 'Database connection error. Please try again later.':
            setError('Unable to connect to the server. Please try again later.');
            break;
          default:
            setError(data.message || 'Signup failed. Please try again.');
        }
      }
    } catch (err: unknown) {
      console.error('Signup error:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError('Failed to signup. Please try again.');
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium">
              Profile Picture (Optional)
            </label>
            <Input
              id="profilePicture"
              type="file"
              accept="image/jpeg,image/png,image/gif" // Restrict to specific types
              onChange={handleProfilePictureChange}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4"
              disabled={isLoading}
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{' '}
              <a href="/terms-conditions" className="text-primary hover:underline">
                Terms and Conditions
              </a>
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Signup'}
          </Button>
        </form>
        <p className="text-center text-sm">
          Already have an account?{' '}
          <a href="/signin" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}