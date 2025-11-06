  const express = require('express');
  const router = express.Router();

  const { verifyToken } = require('../middlewares/authMiddleware');
  const upload = require('../middlewares/upload');
  const postController = require('../controllers/postController');



  // Upload a new post with images (max 10 files)



  router.post(
    '/upload',
    verifyToken,
    upload.array('images', 10),
    postController.uploadHandlerFlexible
  );

  // Get explore feed (list of posts)
  router.get('/explore', verifyToken, postController.getExploreFeed);

  // Bookmark or unbookmark a post
  router.post('/:postId/bookmark', verifyToken, postController.bookmarkPost);

  // Get all bookmarked posts for current user
  router.get('/bookmarks', verifyToken, postController.getBookmarkedPosts);

  // Get home page data (e.g., top posts, popular categories)
  router.get('/home-data', postController.getHomeData);

  // Get all categories (for dropdown or filters)
  router.get('/categories', postController.getCategories);

  // Like or unlike a post
  router.post('/:postId/like', verifyToken, postController.likePost);
  router.post('/:postId/react', verifyToken, postController.reactToPost);

  // Add comment to a post
  router.post('/:postId/comment', verifyToken, postController.addComment);
  router.get("/:postId/comments",verifyToken, postController.getComments);

// Update comment
router.put('/:postId/comments/:commentId', verifyToken, postController.updateComment);

// Delete comment
router.delete('/:postId/comments/:commentId', verifyToken, postController.deleteComment);

  // Share a post (if you have share functionality)
  router.post('/:postId/share', verifyToken, postController.toggleShare);
 

  // Get all posts (admin or public feed)
  router.get('/all', verifyToken, postController.getAllPosts);

  // Delete a post (only owner or authorized roles)
  router.delete('/:postId', verifyToken, postController.deletePost);

  // Edit a post (only owner or authorized roles)
  router.put('/:postId', verifyToken, postController.editPost);



  // Get posts created by the logged-in user
  router.get('/mine', verifyToken, postController.getMyPosts);

  module.exports = router;
