import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';
import { env } from './env.js';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string | number;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketServer {
  private wss: WSServer;
  private clients: Map<string | number, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WSServer({ 
      server,
      path: '/ws',
      verifyClient: (info, callback) => {
        // Extract token from query string or headers
        const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
        const token = url.searchParams.get('token') || info.req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          logger.warn('WebSocket connection rejected: No token provided');
          callback(false, 401, 'Unauthorized');
          return;
        }

        try {
          const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };
          (info.req as any).userId = decoded.userId;
          callback(true);
        } catch (error) {
          logger.warn({ error }, 'WebSocket connection rejected: Invalid token');
          callback(false, 401, 'Unauthorized');
        }
      }
    });

    this.setupConnectionHandler();
    this.startHeartbeat();

    logger.info('WebSocket server initialized');
  }

  private setupConnectionHandler(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      const userId = (req as any).userId;
      ws.userId = userId;
      ws.isAlive = true;

      // Add client to tracking map
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      logger.info({ userId, totalConnections: this.getTotalConnections() }, 'WebSocket client connected');

      // Send welcome message
      this.sendToSocket(ws, {
        type: 'connected',
        payload: { message: 'Connected to SummonScroll real-time server' }
      });

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error({ error, userId }, 'Failed to parse WebSocket message');
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.removeClient(userId, ws);
        logger.info({ userId, totalConnections: this.getTotalConnections() }, 'WebSocket client disconnected');
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error({ error, userId }, 'WebSocket error');
        this.removeClient(userId, ws);
      });
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    const { type, payload } = message;

    switch (type) {
      case 'ping':
        this.sendToSocket(ws, { type: 'pong', payload: { timestamp: Date.now() } });
        break;
      
      case 'subscribe':
        // Handle subscription to specific channels if needed
        logger.debug({ userId: ws.userId, channel: payload.channel }, 'Client subscribed to channel');
        break;

      default:
        logger.warn({ type, userId: ws.userId }, 'Unknown message type received');
    }
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          logger.debug({ userId: ws.userId }, 'Terminating inactive WebSocket connection');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    logger.debug('WebSocket heartbeat started');
  }

  private removeClient(userId: string | number, ws: AuthenticatedWebSocket): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private sendToSocket(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send a message to a specific user (all their connected clients)
   */
  public sendToUser(userId: string | number, message: WebSocketMessage): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach((ws) => {
        this.sendToSocket(ws, message);
      });
      logger.debug({ userId, type: message.type, clientCount: userClients.size }, 'Message sent to user');
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: WebSocketMessage, excludeUserId?: string | number): void {
    let sentCount = 0;
    this.clients.forEach((userClients, userId) => {
      if (excludeUserId && userId === excludeUserId) {
        return;
      }
      userClients.forEach((ws) => {
        this.sendToSocket(ws, message);
        sentCount++;
      });
    });
    logger.debug({ type: message.type, sentCount }, 'Message broadcast to all clients');
  }

  /**
   * Broadcast to multiple specific users
   */
  public sendToUsers(userIds: (string | number)[], message: WebSocketMessage): void {
    userIds.forEach((userId) => {
      this.sendToUser(userId, message);
    });
  }

  /**
   * Get total number of connected clients
   */
  public getTotalConnections(): number {
    return this.wss.clients.size;
  }

  /**
   * Get number of unique users connected
   */
  public getUniqueUsers(): number {
    return this.clients.size;
  }

  /**
   * Gracefully close all connections
   */
  public async close(): Promise<void> {
    logger.info('Closing WebSocket server...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Notify all clients
    this.broadcast({
      type: 'server_shutdown',
      payload: { message: 'Server is shutting down' }
    });

    // Close all connections
    this.wss.clients.forEach((ws) => {
      ws.close(1000, 'Server shutdown');
    });

    // Close the server
    return new Promise((resolve) => {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}

// Singleton instance
let wsServerInstance: WebSocketServer | null = null;

export function initializeWebSocketServer(server: Server): WebSocketServer {
  if (wsServerInstance) {
    logger.warn('WebSocket server already initialized');
    return wsServerInstance;
  }

  wsServerInstance = new WebSocketServer(server);
  return wsServerInstance;
}

export function getWebSocketServer(): WebSocketServer {
  if (!wsServerInstance) {
    throw new Error('WebSocket server not initialized. Call initializeWebSocketServer first.');
  }
  return wsServerInstance;
}
