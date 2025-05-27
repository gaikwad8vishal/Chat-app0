'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import { Input } from '@/app/ui/input';

// Define the Message type for TypeScript
interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

interface User {
  username: string;
  profilePicture: string | null; // Base64 string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [wsStatus, setWsStatus] = useState<string>('Connecting...');
  const [senderProfilePictures, setSenderProfilePictures] = useState<
    Record<string, string | null>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch user data (including profile picture)
  useEffect(() => {
    const username = sessionStorage.getItem('username');
    if (!username) {
      router.push('/signin');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data.user);
        } else {
          console.error('Failed to fetch user:', data.message);
          sessionStorage.removeItem('username');
          router.push('/signin');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        sessionStorage.removeItem('username');
        router.push('/signin');
      }
    };

    fetchUser();
  }, [router]);

  // Initialize WebSocket connection
  useEffect(() => {
    const username = sessionStorage.getItem('username');
    if (!username) return;

    const websocket = new WebSocket(`ws://localhost:3000?username=${username}`);

    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
      setWsStatus('Connected');
    };

    websocket.onmessage = (event: MessageEvent) => {
      const message: Message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);

      // Fetch sender's profile picture if not already fetched
      if (message.sender !== username && !senderProfilePictures[message.sender]) {
        fetchSenderProfilePicture(message.sender);
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setWsStatus('Disconnected');
    };

    websocket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      setWsStatus('Disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [senderProfilePictures]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch sender's profile picture
  const fetchSenderProfilePicture = async (sender: string) => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sender }),
      });
      const data = await response.json();
      if (response.ok) {
        setSenderProfilePictures((prev) => ({
          ...prev,
          [sender]: data.user.profilePicture,
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile picture for ${sender}:`, error);
    }
  };

  // Handle form submission
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputMessage.trim() && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(inputMessage);
      setInputMessage('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username');
    router.push('/signin');
  };

  // Default avatar if no profile picture
  const defaultAvatar = 'https://avatars.githubusercontent.com/u/1?v=4';

  // Convert base64 to data URL for images
  const getProfilePictureUrl = (base64: string | null) => {
    if (!base64) return defaultAvatar;
    return `data:image/jpeg;base64,${base64}`;
  };

  // Format timestamp to show date for non-today messages
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) {
      return date.toLocaleTimeString();
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col justify-between bg-background">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <img
            src={getProfilePictureUrl(user.profilePicture)}
            alt="Avatar"
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.username}</span>
            <span className="text-xs text-muted-foreground">{wsStatus}</span>
          </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-more-horizontal"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </Button>
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card">
            <Button
              variant="ghost"
              className="w-full text-left px-4 py-2 text-sm text-foreground"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                msg.sender === user.username ? 'justify-end' : ''
              }`}
            >
              {msg.sender !== user.username && (
                <img
                  src={getProfilePictureUrl(senderProfilePictures[msg.sender])}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div
                className={`max-w-xs rounded-lg p-4 ${
                  msg.sender === user.username
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <p>{msg.content}</p>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              {msg.sender === user.username && (
                <img
                  src={getProfilePictureUrl(user.profilePicture)}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-6">
        <Input
          type="text"
          placeholder="Type a message..."
          className="flex-1"
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputMessage(e.target.value)
          }
        />
        <Button
          type="submit"
          disabled={!inputMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN}
          title={
            !inputMessage.trim()
              ? 'Message cannot be empty'
              : !ws || ws.readyState !== WebSocket.OPEN
              ? 'Not connected to chat server'
              : 'Send message'
          }
        >
          Send
        </Button>
      </form>
      <div className="flex justify-center p-1 text-sm text-muted-foreground">
        <span>Powered by Next.js and Tailwind CSS</span>
      </div>
    </div>
  );
}