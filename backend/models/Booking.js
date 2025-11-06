// models/Booking.js
import mongoose from 'mongoose';

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  CANCELLED_BY_CREATOR: 'cancelled_by_creator',
  CANCELLED_BY_DESIGNER: 'cancelled_by_designer',
  EXPIRED: 'expired',
};

const bookingSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // store as UTC Date objects; we’ll handle time zones in services
  start: { type: Date, required: true, index: true },
  end:   { type: Date, required: true, index: true },

  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING,
    index: true,
  },

  // for declines/cancellations by designer (or optional notes)
  reason: { type: String },

  // audit trail for debugging/support
  timeline: [{
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String }, // created|approved|declined|cancelled|expired
    note: { type: String }
  }],
}, { timestamps: true });

// helpful compound indexes
bookingSchema.index({ designer: 1, start: 1, end: 1 });
bookingSchema.index({ creator: 1, start: 1 });

// belt-and-suspenders: prevent overlapping pending/approved on the same designer
bookingSchema.pre('save', async function(next) {
  // skip if turning into a non-active status
  const activeStatuses = [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED];
  if (!activeStatuses.includes(this.status)) return next();

  const overlap = await mongoose.model('Booking').findOne({
    _id: { $ne: this._id },
    designer: this.designer,
    status: { $in: activeStatuses },
    start: { $lt: this.end },
    end:   { $gt: this.start },
  }).select('_id');

  if (overlap) return next(new Error('Designer already booked for this time'));
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
