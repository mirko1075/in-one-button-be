/**
 * Application Entry Point
 * Starts the Express server and WebSocket server
 */

import { App } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { disconnectDatabase } from './config/database';

// Create application instance
const app = new App();

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    const port = env.port;

    app.server.listen(port, () => {
      logger.info(`🚀 Server is running on port ${port}`);
      logger.info(`📝 Environment: ${env.nodeEnv}`);
      logger.info(`🌐 API URL: ${env.urls.backend}`);
      logger.info(`🔌 WebSocket server is running`);

      if (env.cron.enabled) {
        logger.info(`⏰ Cron jobs enabled`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, starting graceful shutdown`);

  try {
    // Stop accepting new connections
    app.server.close(() => {
      logger.info('HTTP server closed');
    });

    // Cleanup resources
    await app.cleanup();

    // Disconnect from database
    await disconnectDatabase();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;
