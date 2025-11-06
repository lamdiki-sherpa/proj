// routes/bookingRoutes.js
import express from 'express';
import {
  createBooking,
  updateBookingStatus,
  cancelByCreator,
  cancelByDesigner
} from '../controllers/bookingController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = express.Router();

// Creator requests a booking
router.post(
  '/',
  verifyToken,
  authorizeRoles('creator'),
  createBooking
);

// Designer approves/declines booking
router.put(
  '/:id/status',
  verifyToken,
  authorizeRoles('designer'),
  updateBookingStatus
);

// Creator cancels
router.put(
  '/:id/cancel-by-creator',
  verifyToken,
  authorizeRoles('creator'),
  cancelByCreator
);

// Designer cancels
router.put(
  '/:id/cancel-by-designer',
  verifyToken,
  authorizeRoles('designer'),
  cancelByDesigner
);

export default router;
