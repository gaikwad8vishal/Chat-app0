'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Define the Message type for TypeScript
interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const username = 'JohnDoe'; // Replace with dynamic user data (e.g., from auth)
    const websocket = new WebSocket(`ws://localhost:3000?username=${username}`);

    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    websocket.onmessage = (event: MessageEvent) => {
      const message: Message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    websocket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    // Cleanup on component unmount
    return () => {
      websocket.close();
    };
  }, []);

  // Handle form submission
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputMessage.trim() && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col justify-between bg-background">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <img
            src="https://avatars.githubusercontent.com/u/1?v=4"
            alt="Avatar"
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">John Doe</span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
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
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                msg.sender === 'JohnDoe' ? 'justify-end' : ''
              }`}
            >
              {msg.sender !== 'JohnDoe' && (
                <img
                  src="https://avatars.githubusercontent.com/u/1?v=4"
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div
                className={`max-w-xs rounded-lg p-4 ${
                  msg.sender === 'JohnDoe'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <p>{msg.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {msg.sender === 'JohnDoe' && (
                <img
                  src="https://avatars.githubusercontent.com/u/1?v=4"
                  alt="Avatar"
                  className="h-8 w-8 rounded-full"
                />
              )}
            </div>
          ))}
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
        <Button type="submit">Send</Button>
      </form>
      <div className="flex justify-center p-1 text-sm text-muted-foreground">
        <span>Powered by Next.js and Tailwind CSS</span>
      </div>
    </div>
  );
}