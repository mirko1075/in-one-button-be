/**
 * Password Utility Tests
 */

import { hashPassword, comparePassword } from '../../../utils/password';

describe('Password Utility', () => {
  const plainPassword = 'TestPassword123';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(plainPassword);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword(plainPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword('WrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });
});
