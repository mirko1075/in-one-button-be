/**
 * Environment Configuration
 * Validates and exports all environment variables with type safety
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8080'),

  // Database
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),

  // Auth0
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string(),
  AUTH0_ISSUER: z.string().url(),

  // JWT (fallback)
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_ID_FREE: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().optional(),

  // Deepgram
  DEEPGRAM_API_KEY: z.string(),

  // SendGrid
  SENDGRID_API_KEY: z.string(),
  SENDGRID_FROM_EMAIL: z.string().email(),
  SENDGRID_FROM_NAME: z.string().default('OneButton'),

  // Slack
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),

  // Application URLs
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),

  // Security
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // File storage
  MAX_AUDIO_FILE_SIZE: z.string().default('104857600'),
  TEMP_STORAGE_PATH: z.string().default('./temp'),

  // Cron jobs
  ENABLE_CRON_JOBS: z.string().default('true'),
  MEETING_RETENTION_DAYS: z.string().default('90'),

  // Logging
  LOG_LEVEL: z.string().default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),

  // WebSocket
  WEBSOCKET_PING_INTERVAL: z.string().default('25000'),
  WEBSOCKET_PING_TIMEOUT: z.string().default('60000'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

// Export validated configuration
export const config = parseEnv();

// Type-safe configuration object
export const env = {
  // Node
  nodeEnv: config.NODE_ENV,
  port: parseInt(config.PORT, 10),
  isProduction: config.NODE_ENV === 'production',
  isDevelopment: config.NODE_ENV === 'development',
  isTest: config.NODE_ENV === 'test',

  // Database
  database: {
    url: config.DATABASE_URL,
    testUrl: config.TEST_DATABASE_URL,
  },

  // Auth0
  auth0: {
    domain: config.AUTH0_DOMAIN,
    audience: config.AUTH0_AUDIENCE,
    issuer: config.AUTH0_ISSUER,
  },

  // JWT
  jwt: {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN,
  },

  // Stripe
  stripe: {
    secretKey: config.STRIPE_SECRET_KEY,
    publishableKey: config.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: config.STRIPE_WEBHOOK_SECRET,
    priceIds: {
      free: config.STRIPE_PRICE_ID_FREE,
      pro: config.STRIPE_PRICE_ID_PRO,
      enterprise: config.STRIPE_PRICE_ID_ENTERPRISE,
    },
  },

  // Deepgram
  deepgram: {
    apiKey: config.DEEPGRAM_API_KEY,
  },

  // SendGrid
  sendgrid: {
    apiKey: config.SENDGRID_API_KEY,
    fromEmail: config.SENDGRID_FROM_EMAIL,
    fromName: config.SENDGRID_FROM_NAME,
  },

  // Slack
  slack: {
    botToken: config.SLACK_BOT_TOKEN,
    signingSecret: config.SLACK_SIGNING_SECRET,
  },

  // URLs
  urls: {
    frontend: config.FRONTEND_URL,
    backend: config.BACKEND_URL,
  },

  // Security
  security: {
    corsOrigins: config.CORS_ORIGINS.split(','),
    rateLimitWindowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
    rateLimitMaxRequests: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  // Storage
  storage: {
    maxAudioFileSize: parseInt(config.MAX_AUDIO_FILE_SIZE, 10),
    tempStoragePath: config.TEMP_STORAGE_PATH,
  },

  // Cron
  cron: {
    enabled: config.ENABLE_CRON_JOBS === 'true',
    meetingRetentionDays: parseInt(config.MEETING_RETENTION_DAYS, 10),
  },

  // Logging
  logging: {
    level: config.LOG_LEVEL,
    filePath: config.LOG_FILE_PATH,
  },

  // WebSocket
  websocket: {
    pingInterval: parseInt(config.WEBSOCKET_PING_INTERVAL, 10),
    pingTimeout: parseInt(config.WEBSOCKET_PING_TIMEOUT, 10),
  },
};
