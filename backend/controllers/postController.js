const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
// Upload new post with images
exports.uploadHandlerFlexible = async (req, res) => {
  try {
    const { designName, category, description } = req.body;
    const user = req.user;

    if (!designName || !category || !description) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    // Use category as provided by user, no validation against Category collection
    const finalCategory = category.trim();

    const imageUrls = req.files.map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });

    const post = new Post({
      userId: user._id,
      designName,
      category: finalCategory,
      description,
      imageUrls,
      likes: [],
      comments: [],
    });

    await post.save();

    res.status(201).json({ message: 'Post uploaded successfully', post });

  } catch (error) {
    console.error('Upload post error:', error);
    res.status(500).json({ message: 'Failed to upload post', error: error.message });
  }
};


exports.getHomeData = async (req, res) => {
  try {
    // Example implementation - adjust based on your needs
    const topPosts = await Post.find()
      .sort({ likes: -1 })
      .limit(5)
      .populate('userId', 'name profilePic');
    
    // Get popular categories (example implementation)
    const categoryCounts = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const popularCategories = categoryCounts.map(cat => cat._id);

    res.status(200).json({
      topPosts,
      popularCategories
    });
  } catch (error) {
    console.error('Get home data error:', error);
    res.status(500).json({ message: 'Failed to get home data', error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    // Get distinct categories from posts
    const categories = await Post.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories', error: error.message });
  }
};

exports.sharePost = async (req, res) => {
  try {
    // TODO: Implement share functionality
    res.status(501).json({ message: 'Share functionality not implemented yet' });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Failed to share post', error: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ message: 'Failed to get posts', error: error.message });
  }
};

// Get explore feed (recent posts with like/comment info)
exports.getExploreFeed = async (req, res) => {
  try {
    const userId = req.user?._id;

    let posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email profilePic')
      .lean();

    posts = posts.map(post => {
      const likesCount = post.likes.length;
      const commentsCount = post.comments.length;
      const hasLiked = userId ? post.likes.some(id => id.equals(userId)) : false;

      return {
        ...post,
        userName: post.userId?.name || post.userId?.email || 'Unknown',
        likesCount,
        commentsCount,
        hasLiked,
      };
    });

    res.status(200).json({ posts });
  } catch (error) {
    console.error('Get explore feed error:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
};


// Toggle reaction on post by type (like, heart, laugh, clap)
exports.reactToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body; // e.g., 'like', 'heart', 'laugh', 'clap'
    const userId = req.user._id;

    if (!reactionType) {
      return res.status(400).json({ message: 'Reaction type required' });
    }

    const validReactions = ['like', 'heart', 'laugh', 'clap'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Initialize reactions object if not present
    if (!post.reactions) post.reactions = {};

    // Initialize array for this reaction type if not present
    if (!Array.isArray(post.reactions[reactionType])) {
      post.reactions[reactionType] = [];
    }

    // Check if user already reacted with this reaction type
    const hasReacted = post.reactions[reactionType].some(id => id.equals(userId));

    if (hasReacted) {
      // Remove user from reaction array
      post.reactions[reactionType] = post.reactions[reactionType].filter(id => !id.equals(userId));
    } else {
      // Add user to reaction array
      post.reactions[reactionType].push(userId);
    }

    // Optional: Remove user from other reaction arrays if you want one reaction per user only
    validReactions.forEach(type => {
      if (type !== reactionType && Array.isArray(post.reactions[type])) {
        post.reactions[type] = post.reactions[type].filter(id => !id.equals(userId));
      }
    });

    await post.save();

    // Count reactions
    const reactionCounts = {};
    validReactions.forEach(type => {
      reactionCounts[type] = post.reactions[type] ? post.reactions[type].length : 0;
    });

    res.status(200).json({
      message: hasReacted ? `Removed ${reactionType} reaction` : `Added ${reactionType} reaction`,
      reactionCounts,
    });
  } catch (error) {
    console.error('React to post error:', error);
    res.status(500).json({ message: 'Failed to react to post', error: error.message });
  }
};

// Like or unlike a post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const hasLiked = post.likes.some(id => id.equals(userId));

    if (hasLiked) {
      post.likes = post.likes.filter(id => !id.equals(userId));
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: hasLiked ? 'Unliked post' : 'Liked post',
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Failed to like/unlike post', error: error.message });
  }
};


exports.toggleShare = async (req, res) => {
  try {
    const { postId } = req.params; // ID of the original post
    const { message } = req.body;
    const user = req.user;

    let originalPost = await Post.findById(postId).populate("userId", "name profilePic");
    if (!originalPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyShared = originalPost.shares.includes(user._id);

    if (alreadyShared) {
      // ----- UNSHARE -----
      originalPost.shares = originalPost.shares.filter(
        id => id.toString() !== user._id.toString()
      );
      await originalPost.save();

      // Remove shared post from feed
      await Post.findOneAndDelete({
        originalPost: postId,
        userId: user._id,
        isShared: true
      });

      // Fetch updated original post with populated user info
      originalPost = await Post.findById(postId).populate("userId", "name profilePic");

      return res.status(200).json({
        message: "Post unshared successfully",
        isShared: false,
        sharesCount: originalPost.sharesCount,
        originalPost
      });
    } else {
      // ----- SHARE -----
      originalPost.shares.push(user._id);
      await originalPost.save();

      // Create shared post in feed
      const sharedPost = new Post({
        userId: user._id,
        userName: user.name,
        isShared: true,
        originalPost: postId,
        designName: originalPost.designName,
        category: originalPost.category,
        description: message || "Check out this design!",
        imageUrls: originalPost.imageUrls,
        likes: [],
        comments: [],
        sharedBy: user._id
      });
      await sharedPost.save();

      // Fetch updated original post with populated user info
      originalPost = await Post.findById(postId).populate("userId", "name profilePic");

      return res.status(201).json({
        message: "Post shared successfully",
        isShared: true,
        sharesCount: originalPost.sharesCount,
        originalPost,
        sharedPost
      });
    }
  } catch (error) {
    console.error("Toggle share error:", error);
    res.status(500).json({ message: "Failed to toggle share", error: error.message });
  }
};



exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const user = req.user;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      userId: user._id,
      userName: user.name,
      userProfilePic: user.profilePic || null,
      comment: comment.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({
      message: "Comment added",
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).select('comments');
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ comments: post.comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Failed to get comments", error: error.message });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { comment } = req.body;
    const user = req.user;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const commentToUpdate = post.comments.id(commentId);
    if (!commentToUpdate) return res.status(404).json({ message: "Comment not found" });

    // Only author can update
    if (commentToUpdate.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    commentToUpdate.comment = comment.trim();
    await post.save();

    res.json({ message: "Comment updated", comment: commentToUpdate });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ message: "Failed to update comment", error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const user = req.user;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const commentToDelete = post.comments.id(commentId);
    if (!commentToDelete) return res.status(404).json({ message: "Comment not found" });

    // Only author can delete
    if (commentToDelete.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    commentToDelete.remove();
    await post.save();

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Failed to delete comment", error: error.message });
  }
};

// Edit a post (only owner)
exports.editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { designName, category, description } = req.body;

    if (!designName || !category || !description) {
      return res.status(400).json({ message: 'All fields are required to update the post.' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.userId.equals(userId)) {
      return res.status(403).json({ message: 'You are not authorized to edit this post.' });
    }

    post.designName = designName;
    post.category = category;
    post.description = description;
    post.updatedAt = new Date();

    await post.save();

    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
};

// Delete a post (only owner)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.userId.equals(userId)) {
      return res.status(403).json({ message: 'You are not authorized to delete this post.' });
    }

    await Post.deleteOne({ _id: postId });
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
};

exports.bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Find user and check if post exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if post is already bookmarked
    const bookmarkIndex = user.bookmarks.indexOf(postId);
    
    if (bookmarkIndex === -1) {
      // Add bookmark
      user.bookmarks.push(postId);
    } else {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
    }

    await user.save();
    
    res.status(200).json({
      message: bookmarkIndex === -1 ? 'Post bookmarked' : 'Bookmark removed',
      bookmarks: user.bookmarks
    });
  } catch (error) {
    console.error('Bookmark post error:', error);
    res.status(500).json({ message: 'Failed to bookmark post', error: error.message });
  }
};

// Get all bookmarked posts
exports.getBookmarkedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        populate: { 
          path: 'userId',
          select: 'name profilePic' 
        }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Format posts similar to explore feed
    const bookmarkedPosts = user.bookmarks.map(post => {
      if (!post) return null; // Handle deleted posts
      
      return {
        ...post._doc,
        userName: post.userId?.name || 'Unknown',
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        hasLiked: post.likes.some(id => id.equals(req.user._id))
      };
    }).filter(post => post !== null); // Remove null entries

    res.status(200).json({ posts: bookmarkedPosts });
  } catch (error) {
    console.error('Get bookmarked posts error:', error);
    res.status(500).json({ message: 'Failed to get bookmarks', error: error.message });
  }
};

// Get all posts by logged-in user
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ message: 'Failed to get your posts', error: error.message });
  }
};
