/**
 * Test Setup
 * Global test configuration and setup
 */

import { PrismaClient } from '@prisma/client';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/onebutton_test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.AUTH0_DOMAIN = 'test.auth0.com';
process.env.AUTH0_AUDIENCE = 'https://api.test.com';
process.env.AUTH0_ISSUER = 'https://test.auth0.com/';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.DEEPGRAM_API_KEY = 'test_deepgram_key';
process.env.SENDGRID_API_KEY = 'SG.test_key';
process.env.SENDGRID_FROM_EMAIL = 'test@test.com';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BACKEND_URL = 'http://localhost:8080';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.ENABLE_CRON_JOBS = 'false';

// Create Prisma client for tests
const prisma = new PrismaClient();

// Setup before all tests
beforeAll(async () => {
  // Clean database before tests
  await cleanDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

// Clean database helper
async function cleanDatabase() {
  const tables = [
    'webhook_events',
    'audit_logs',
    'integrations',
    'deliveries',
    'meetings',
    'user_settings',
    'users',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (error) {
      // Table might not exist yet
    }
  }
}

export { prisma };
