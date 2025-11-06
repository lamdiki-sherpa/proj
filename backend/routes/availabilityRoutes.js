import express from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware';
import { updateAvailability, getAvailableSlots } from '../controllers/availabilityController.js';

const router = express.Router();

// Designer sets working hours / unavailable dates
router.put(
  '/',
  verifyToken,
  authorizeRoles('designer'),
  updateAvailability
);

// Creator gets available slots
router.get(
  '/slots',
  verifyToken,
  authorizeRoles('creator'),
  getAvailableSlots
);

export default router;
