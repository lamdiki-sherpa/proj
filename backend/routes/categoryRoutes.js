import express from 'express';
import { verifyToken, requireSuperAdmin } from '../middlewares/authMiddleware.js';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();
// 🔒 Superadmin-only
router.post('/', verifyToken, requireSuperAdmin, categoryController.createCategory);
router.get('/', verifyToken, requireSuperAdmin, categoryController.getCategories);
router.delete('/:categoryId', verifyToken, requireSuperAdmin, categoryController.deleteCategory);

// 🌐 Public - for designers/creators to select categories
router.get('/public', categoryController.getCategories); // No token required

export default router;
