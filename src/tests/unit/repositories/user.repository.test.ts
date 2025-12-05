/**
 * User Repository Tests
 */

import { UserRepository } from '../../../repositories/user.repository';
import { prisma } from '../../setup';
import { createTestUser } from '../../helpers/testData';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeAll(() => {
    userRepository = new UserRepository();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = createTestUser();
      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.isActive).toBe(true);
    });

    it('should create user with settings', async () => {
      const userData = createTestUser();
      const user = await userRepository.create(userData);

      expect(user.settings).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const userData = createTestUser();
      const createdUser = await userRepository.create(userData);

      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('should return null for non-existent ID', async () => {
      const user = await userRepository.findById(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = createTestUser();
      const createdUser = await userRepository.create(userData);

      const foundUser = await userRepository.findByEmail(userData.email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(createdUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const userData = createTestUser();
      const user = await userRepository.create(userData);

      const updatedUser = await userRepository.update(user.id, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      const userData = createTestUser();
      const user = await userRepository.create(userData);

      const deletedUser = await userRepository.softDelete(user.id);
      expect(deletedUser.isActive).toBe(false);
    });
  });
});
