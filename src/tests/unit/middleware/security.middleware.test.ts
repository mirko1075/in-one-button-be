/**
 * Security Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../../../middleware/security.middleware';

describe('Security Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('sanitizeInput', () => {
    it('should sanitize body input', () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
      };

      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.email).toBe('test@example.com');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      mockRequest.query = {
        search: '<b>test</b>',
      };

      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockRequest.query.search).not.toContain('<b>');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      mockRequest.body = {
        user: {
          name: '<script>xss</script>',
          profile: {
            bio: '<b>test</b>',
          },
        },
      };

      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockRequest.body.user.name).not.toContain('<script>');
      expect(mockRequest.body.user.profile.bio).not.toContain('<b>');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      mockRequest.body = {
        items: ['<script>test</script>', 'normal text'],
      };

      sanitizeInput(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockRequest.body.items[0]).not.toContain('<script>');
      expect(mockRequest.body.items[1]).toBe('normal text');
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
