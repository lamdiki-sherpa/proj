import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const availabilitySchema = new mongoose.Schema({
  workingHours: {
    mon: { start: String, end: String },
    tue: { start: String, end: String },
    wed: { start: String, end: String },
    thu: { start: String, end: String },
    fri: { start: String, end: String },
    sat: { start: String, end: String },
    sun: { start: String, end: String }
  },
  unavailableDates: [Date]
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, select: false },
  role: { type: String, enum: ['designer', 'creator', 'superadmin'], default: 'creator', required: true },
  experience: { type: String },
  portfolio: { type: String },
  designs: [String],
  profilePic: { type: String },
  suspended: { type: Boolean, default: false },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  rating: { type: Number, min: 0, max: 5, default: 0 },
  skills: [{ type: String, index: true }],
  location: { type: String, index: true },
  availability: availabilitySchema
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() || {};
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);