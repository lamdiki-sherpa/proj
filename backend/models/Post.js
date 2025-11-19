// models/Post.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userProfilePic: { type: String },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  designName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  imageUrls: [{ type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  isShared: { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    clap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
}, { timestamps: true });

// Virtuals
postSchema.virtual('likesCount').get(function () {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

postSchema.virtual('sharesCount').get(function () {
  return this.shares.length;
});

// Always include virtuals when converting to JSON or objects
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// Automatically include virtuals when using `.lean()`
const setLeanWithVirtuals = function () {
  if (this.options && this.options.lean) {
    if (!this.options.lean.virtuals) {
      this.options.lean.virtuals = true;
    }
  }
};

postSchema.pre(['find', 'findOne', 'findById'], setLeanWithVirtuals);

export default mongoose.model('Post', postSchema);
