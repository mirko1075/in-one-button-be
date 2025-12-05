/**
 * Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { strictRateLimiter } from '../middleware/security.middleware';
import {
  registerSchema,
  loginSchema,
  auth0CallbackSchema,
} from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  '/register',
  strictRateLimiter,
  validate(registerSchema),
  authController.register,
);

router.post(
  '/login',
  strictRateLimiter,
  validate(loginSchema),
  authController.login,
);

router.post(
  '/auth0',
  validate(auth0CallbackSchema),
  authController.auth0Callback,
);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
