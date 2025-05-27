import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';



type WebSocket = import('ws').WebSocket;

type clientSet = Set<WebSocket>;

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port: Number(port) });
const handle = app.getRequestHandler();

// Store connected clients
const clients: Set<WebSocket> = new Set();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Create WebSocket server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const username = parse(req.url!, true).query.username || 'Anonymous';
    console.log(`${username} connected`);
    clients.add(ws);

    ws.on('message', (message) => {
      const messageString = message.toString();
      console.log('Received:', messageString);

      // Broadcast to all connected clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) { 
          client.send(
            JSON.stringify({
              sender: username,
              content: messageString,
              timestamp: new Date().toISOString(),
            })
          );
        }
      });
    });

    ws.on('close', () => {
      console.log(`${username} disconnected`);
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Start the server
  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
