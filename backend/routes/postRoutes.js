// routes/postRoutes.js
import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';
import * as postController from '../controllers/postController.js';

const router = express.Router();

// Upload a new post with images (max 10 files)
router.post(
  '/upload',
  verifyToken,
  upload.array('images', 10),
  postController.uploadHandlerFlexible
);

// Get explore feed (list of posts)
router.get('/explore', verifyToken, postController.getExploreFeed);
router.post('/:postId/bookmark', verifyToken, postController.bookmarkPost);
router.get('/bookmarks', verifyToken, postController.getBookmarkedPosts);
router.get('/home-data', postController.getHomeData);
router.get('/categories', postController.getCategories);
router.post('/:postId/like', verifyToken, postController.likePost);
router.post('/:postId/react', verifyToken, postController.reactToPost);
router.post('/:postId/comment', verifyToken, postController.addComment);
router.get('/:postId/comments', verifyToken, postController.getComments);
router.put('/:postId/comments/:commentId', verifyToken, postController.updateComment);
router.delete('/:postId/comments/:commentId', verifyToken, postController.deleteComment);
router.post('/:postId/share', verifyToken, postController.toggleShare);
router.get('/all', verifyToken, postController.getAllPosts);
router.delete('/:postId', verifyToken, postController.deletePost);
router.put('/:postId', verifyToken, postController.editPost);
router.get('/mine', verifyToken, postController.getMyPosts);

export default router;
