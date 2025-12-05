/**
 * Authentication Service Tests
 */

import { AuthService } from '../../../services/auth.service';
import { UserRepository } from '../../../repositories/user.repository';
import { prisma } from '../../setup';
import { createTestUser } from '../../helpers/testData';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.auditLog.deleteMany({});
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = createTestUser();

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const userData = createTestUser({ email: 'invalid' });

      await expect(authService.register(userData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      const userData = createTestUser({ password: 'weak' });

      await expect(authService.register(userData)).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const userData = createTestUser();

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const userData = createTestUser();
      await authService.register(userData);

      const result = await authService.login(
        userData.email,
        userData.password!,
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'WrongPassword123'),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for wrong password', async () => {
      const userData = createTestUser();
      await authService.register(userData);

      await expect(
        authService.login(userData.email, 'WrongPassword123'),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('authenticateAuth0User', () => {
    it('should create new user for new Auth0 user', async () => {
      const result = await authService.authenticateAuth0User(
        'auth0|123456',
        'auth0user@example.com',
        { firstName: 'Auth0', lastName: 'User' },
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('auth0user@example.com');
      expect(result.token).toBeDefined();
    });

    it('should return existing user for returning Auth0 user', async () => {
      // First login
      const result1 = await authService.authenticateAuth0User(
        'auth0|123456',
        'auth0user@example.com',
      );

      // Second login
      const result2 = await authService.authenticateAuth0User(
        'auth0|123456',
        'auth0user@example.com',
      );

      expect(result2.user.id).toBe(result1.user.id);
    });
  });
});
