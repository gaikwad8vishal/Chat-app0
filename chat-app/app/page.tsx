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
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch user data (including profile picture) on component mount
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
          sessionStorage.removeItem('authToken');
          router.push('/signin');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('authToken');
        router.push('/signin');
      }
    };

    fetchUser();
  }, [router]);

  // Initialize WebSocket connection with reconnection logic
  useEffect(() => {
    const username = sessionStorage.getItem('username');
    const authToken = sessionStorage.getItem('authToken');
    if (!username || !authToken) {
      router.push('/signin');
      return;
    }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      // Connect to the correct WebSocket path (/ws) with username and token
      const websocket = new WebSocket(`ws://localhost:3000/ws?username=${username}&token=${authToken}`);
      setWsStatus('Connecting...');

      websocket.onopen = () => {
        console.log('Connected to WebSocket server');
        setWsStatus('Connected');
        reconnectAttempts = 0; // Reset attempts on successful connection
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };

      websocket.onmessage = (event: MessageEvent) => {
        try {
          const message: Message = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);

          // Fetch sender's profile picture if not already fetched
          if (message.sender !== username && !senderProfilePictures[message.sender]) {
            fetchSenderProfilePicture(message.sender);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setWsStatus('Disconnected');

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1})`);
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts += 1;
            connectWebSocket();
          }, delay);
        } else {
          console.error('Max reconnect attempts reached. Please refresh the page.');
          setWsStatus('Disconnected (Max reconnect attempts reached)');
        }
      };

      websocket.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        setWsStatus('Disconnected');
      };

      setWs(websocket);
    };

    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [router]); // Depend on router to handle navigation changes

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

  // Handle form submission to send a message
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
    sessionStorage.removeItem('authToken');
    if (ws) {
      ws.close();
    }
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Loading state while fetching user data
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col justify-between bg-background">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6 shadow-sm bg-card">
        <div className="flex items-center gap-3">
          <img
            src={getProfilePictureUrl(user.profilePicture)}
            alt="Avatar"
            className="h-10 w-10 rounded-full border-2 border-primary"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{user.username}</span>
            <span
              className={`text-xs ${
                wsStatus === 'Connected'
                  ? 'text-green-500'
                  : wsStatus === 'Disconnected'
                  ? 'text-red-500'
                  : 'text-yellow-500'
              }`}
            >
              {wsStatus}
            </span>
          </div>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="hover:bg-muted rounded-full"
          >
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
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-10 transition-opacity duration-200">
              <Button
                variant="ghost"
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md"
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted min-h-[200px]">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                msg.sender === user.username ? 'justify-end' : 'justify-start'
              } max-w-full`}
            >
              {msg.sender !== user.username && (
                <img
                  src={getProfilePictureUrl(senderProfilePictures[msg.sender])}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border border-muted"
                />
              )}
              <div
                className={`max-w-xs sm:max-w-sm md:max-w-md rounded-xl p-4 shadow-sm ${
                  msg.sender === user.username
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <span className="text-xs text-muted-foreground block mt-1">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              {msg.sender === user.username && (
                <img
                  src={getProfilePictureUrl(user.profilePicture)}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full border border-muted"
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 border-t p-6 bg-card shadow-sm rounded-t-lg"
      >
        <Input
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-lg focus:ring-2 focus:ring-primary"
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
        >
          Send
        </Button>
      </form>

      {/* Footer */}
      <div className="flex justify-center p-1 text-sm text-muted-foreground">
        <span>Powered by Next.js and Tailwind CSS</span>
      </div>
    </div>
  );
}