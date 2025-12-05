/**
 * Logger Utility
 * Winston-based logging with multiple transports
 */

import winston from 'winston';
import { env } from '../config/env';
import path from 'path';
import fs from 'fs';

// Ensure log directory exists
if (!fs.existsSync(env.logging.filePath)) {
  fs.mkdirSync(env.logging.filePath, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.logging.level,
  format: logFormat,
  defaultMeta: { service: 'onebutton-api' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(env.logging.filePath, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(env.logging.filePath, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in non-production
if (!env.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
