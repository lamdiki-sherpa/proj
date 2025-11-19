import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { listDesigners, getDesignerProfile } from '../controllers/designerController.js';

const router = express.Router();

// list all designers
router.get('/', verifyToken, listDesigners);

// single designer profile
router.get('/:id', verifyToken, getDesignerProfile);

export default router;
