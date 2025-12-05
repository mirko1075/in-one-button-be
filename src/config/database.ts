/**
 * Database Configuration
 * Handles Prisma Client initialization and connection management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton pattern for Prisma Client
let prisma: PrismaClient;

/**
 * Get Prisma Client instance
 * @returns PrismaClient instance
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });

    // Handle connection events
    prisma.$connect()
      .then(() => {
        logger.info('Database connected successfully');
      })
      .catch((error) => {
        logger.error('Database connection failed:', error);
        process.exit(1);
      });
  }

  return prisma;
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
};

// Export singleton instance
export const db = getPrismaClient();
