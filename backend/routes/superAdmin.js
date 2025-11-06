const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/authMiddleware');

// Apply verifyToken and requireSuperAdmin middleware to all routes here
router.use(verifyToken, requireSuperAdmin);

// Get all users
router.get('/users', superAdminController.getAllUsers);

// Get all designers
router.get('/designers', superAdminController.getAllDesigners);

// Delete a user by ID
router.delete('/users/:id', superAdminController.deleteUser);

// Change user role
router.patch('/users/:id/role', superAdminController.changeUserRole);

// Suspend user
router.patch('/users/:id/suspend', superAdminController.suspendUser);

// Dashboard stats
router.get('/dashboard/stats', superAdminController.getDashboardStats);

// Get latest posts
router.get('/posts/latest', superAdminController.getLatestPosts);

// Engagement stats (likes and comments)
router.get('/posts/engagement-stats', superAdminController.getEngagementStats);

// Weekly analysis (posts last 7 days)
router.get('/posts/weekly-analysis', superAdminController.getWeeklyAnalysis);

// Daily posts count (last 7 days)
router.get('/posts/daily-count', superAdminController.getDailyPostsCount);

// Daily analysis (last 24 hours)
router.get('/posts/daily-analysis', superAdminController.getDailyAnalysis);

// Weekly posts count (last 4 weeks)
router.get('/posts/weekly-count', superAdminController.getWeeklyPostsCount);

module.exports = router;
