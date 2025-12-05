/**
 * Meeting Routes
 */

import { Router } from 'express';
import { MeetingController } from '../controllers/meeting.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import {
  createMeetingSchema,
  updateMeetingSchema,
  meetingIdSchema,
  shareTokenSchema,
} from '../validators/meeting.validator';

const router = Router();
const meetingController = new MeetingController();

// Protected routes
router.post(
  '/',
  authenticate,
  validate(createMeetingSchema),
  meetingController.createMeeting,
);

router.get('/', authenticate, meetingController.getMeetings);

router.get(
  '/statistics',
  authenticate,
  meetingController.getStatistics,
);

router.get(
  '/:id',
  authenticate,
  validate(meetingIdSchema),
  meetingController.getMeeting,
);

router.patch(
  '/:id',
  authenticate,
  validate(meetingIdSchema),
  validate(updateMeetingSchema),
  meetingController.updateMeeting,
);

router.post(
  '/:id/start',
  authenticate,
  validate(meetingIdSchema),
  meetingController.startMeeting,
);

router.post(
  '/:id/end',
  authenticate,
  validate(meetingIdSchema),
  meetingController.endMeeting,
);

router.post(
  '/:id/share',
  authenticate,
  validate(meetingIdSchema),
  meetingController.generateShareLink,
);

router.delete(
  '/:id',
  authenticate,
  validate(meetingIdSchema),
  meetingController.deleteMeeting,
);

// Public route (with optional auth)
router.get(
  '/share/:token',
  optionalAuth,
  validate(shareTokenSchema),
  meetingController.getMeetingByShareToken,
);

export default router;
