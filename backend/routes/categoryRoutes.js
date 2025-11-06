const express = require('express');
const router = express.Router();
const { verifyToken, requireSuperAdmin } = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

// 🔒 Superadmin-only
router.post('/', verifyToken, requireSuperAdmin, categoryController.createCategory);
router.get('/', verifyToken, requireSuperAdmin, categoryController.getCategories);
router.delete('/:categoryId', verifyToken, requireSuperAdmin, categoryController.deleteCategory);

// 🌐 Public - for designers/creators to select categories
router.get('/public', categoryController.getCategories); // No token required

module.exports = router;
