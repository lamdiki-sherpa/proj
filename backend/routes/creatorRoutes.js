import { Router } from 'express';
import { auth, requireRole } from '../middlewares/authMiddleware';
import { listDesigners, getDesigner, requestBooking, myBookings, cancelByCreator } from '../controllers/creatorController.js';

const router = Router();

router.get('/designers', listDesigners);
router.get('/designers/:id', getDesigner);
router.get('/designers/:id/availability', getDesigner); // profile endpoint already returns availability snippet; keep for symmetry

router.use(auth());
router.use(requireRole('creator', 'superadmin'));

router.post('/bookings', requestBooking);
router.get('/bookings', myBookings);
router.patch('/bookings/:id/cancel', cancelByCreator);

export default router;