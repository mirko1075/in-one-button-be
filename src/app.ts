/**
 * Express Application Setup
 * Configures middleware and routes
 */

import express, { Application } from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { env } from './config/env';
import { morganStream } from './utils/logger';
import {
  helmetMiddleware,
  corsMiddleware,
  rateLimiter,
  hppMiddleware,
  sanitizeInput,
} from './middleware/security.middleware';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware';
import routes from './routes';
import { AudioStreamHandler } from './sockets/audioStream.handler';
import { JobManager } from './jobs';

export class App {
  public app: Application;
  public server: ReturnType<typeof createServer>;
  public io: Server;
  private audioStreamHandler: AudioStreamHandler;
  private jobManager: JobManager;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: env.security.corsOrigins,
        credentials: true,
      },
      pingInterval: env.websocket.pingInterval,
      pingTimeout: env.websocket.pingTimeout,
    });

    // Make io globally available for socket handlers
    (global as any).io = this.io;

    this.audioStreamHandler = new AudioStreamHandler();
    this.jobManager = new JobManager();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSockets();
    this.initializeCronJobs();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmetMiddleware);
    this.app.use(corsMiddleware);
    this.app.use(hppMiddleware);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Request sanitization
    this.app.use(sanitizeInput);

    // Logging middleware
    if (env.isDevelopment) {
      this.app.use(morgan('dev', { stream: morganStream }));
    } else {
      this.app.use(morgan('combined', { stream: morganStream }));
    }

    // Rate limiting (apply to all routes)
    this.app.use(rateLimiter);

    // Trust proxy (for rate limiting and IP detection)
    this.app.set('trust proxy', 1);
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'OneButton API',
        version: '1.0.0',
        environment: env.nodeEnv,
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Initialize WebSocket handlers
   */
  private initializeWebSockets(): void {
    this.audioStreamHandler.initializeHandlers(this.io);
  }

  /**
   * Initialize cron jobs
   */
  private initializeCronJobs(): void {
    if (env.cron.enabled) {
      this.jobManager.startAll();
    }
  }

  /**
   * Cleanup on shutdown
   */
  async cleanup(): Promise<void> {
    await this.audioStreamHandler.cleanup();
    this.jobManager.stopAll();
    this.io.close();
  }
}
