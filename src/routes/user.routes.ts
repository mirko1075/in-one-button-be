/**
 * User Routes
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  updateProfileSchema,
  updateSettingsSchema,
} from '../validators/user.validator';

const router = Router();
const userController = new UserController();

// All routes are protected
router.get('/profile', authenticate, userController.getProfile);

router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  userController.updateProfile,
);

router.get('/settings', authenticate, userController.getSettings);

router.patch(
  '/settings',
  authenticate,
  validate(updateSettingsSchema),
  userController.updateSettings,
);

router.delete('/account', authenticate, userController.deleteAccount);

export default router;
