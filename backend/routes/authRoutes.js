import express from 'express';
import upload from '../middlewares/upload.js';
import * as authController from '../controllers/authController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';
const router = express.Router();
// Define rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 5 requests per IP per window
  message: 'Too many requests from this IP, please try again later.',
});

// 👤 Public Routes with rate limiting
router.post('/register', authLimiter, upload.array('designs', 5), authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', verifyToken, authController.getMe);

router.get('/profile/:uid', verifyToken, authController.getProfile);
router.put('/profile/update', verifyToken, authController.updateProfile);

// Example role-based route
router.get('/admin-only', verifyToken, authorizeRoles('superadmin'), (req, res) => {
  res.json({ message: 'Welcome Super Admin', user: req.user });
});

export default router;
