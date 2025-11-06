import { Router } from 'express';
import { auth } from '../middlewares/authMiddleware';
import { getUpcomingConfirmed } from '../controllers/bookingController.js';

const router = Router();
router.use(auth());
router.get('/bookings/upcoming', getUpcomingConfirmed);
export default router;