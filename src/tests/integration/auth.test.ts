/**
 * Authentication Integration Tests
 */

import request from 'supertest';
import { App } from '../../app';
import { prisma } from '../setup';
import { createTestUser } from '../helpers/testData';

describe('Authentication API', () => {
  let app: App;

  beforeAll(() => {
    app = new App();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = createTestUser();

      const response = await request(app.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const userData = createTestUser({ email: 'invalid-email' });

      const response = await request(app.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const userData = createTestUser({ password: 'weak' });

      const response = await request(app.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      const userData = createTestUser();

      // Register first time
      await request(app.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app.app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const userData = createTestUser();

      // Register user first
      await request(app.app).post('/api/auth/register').send(userData);

      // Login
      const response = await request(app.app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const userData = createTestUser();

      // Register and get token
      const registerResponse = await request(app.app)
        .post('/api/auth/register')
        .send(userData);

      const token = registerResponse.body.data.token;

      // Get current user
      const response = await request(app.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app.app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
