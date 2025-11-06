const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const authController = require('../controllers/authController'); // <---- ADD THIS
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

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

module.exports = router;
