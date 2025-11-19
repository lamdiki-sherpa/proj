// controllers/bookingController.js
import { Booking, BOOKING_STATUS } from '../models/Booking.js';
import { User } from '../models/User.js';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema
} from '../validators/bookingSchemas.js';

// Creator: request a booking
export const createBooking = async (req, res) => {
  try {
    const parsed = createBookingSchema.parse(req.body);
    const { designerId, start, end } = parsed;

    if (req.user.role !== 'creator') {
      return res.status(403).json({ message: 'Only creators can request bookings' });
    }

    // check designer exists
    const designer = await User.findById(designerId);
    if (!designer || designer.role !== 'designer') {
      return res.status(404).json({ message: 'Designer not found' });
    }

    const booking = new Booking({
      creator: req.user._id,
      designer: designerId,
      start: new Date(start),
      end: new Date(end),
      status: BOOKING_STATUS.PENDING,
      timeline: [{ by: req.user._id, action: 'created' }]
    });

    await booking.save();

    const io = req.app.get('io');
io.to(designerId.toString()).emit('bookingRequest', {
  bookingId: booking._id,
  message: `New booking request from ${req.user.name}`
});

    return res.status(201).json({ message: 'Booking request created', booking });
  } catch (err) {
    console.error('createBooking error:', err);
    return res.status(400).json({ message: err.message });
  }
};

// Designer: approve / decline request
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = updateBookingStatusSchema.parse(req.body);
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.designer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }

    if (booking.status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({ message: 'Only pending bookings can be updated' });
    }

    booking.status = status === 'approved'
      ? BOOKING_STATUS.APPROVED
      : BOOKING_STATUS.DECLINED;

    if (reason) booking.reason = reason;

    booking.timeline.push({
      by: req.user._id,
      action: booking.status,
      note: reason
    });

    await booking.save();
const io = req.app.get('io');
io.to(booking.creator.toString()).emit('bookingStatusUpdate', {
  bookingId: booking._id,
  status: booking.status,
  message: `Your booking has been ${booking.status}`
});

    return res.json({ message: `Booking ${booking.status}`, booking });
  } catch (err) {
    console.error('updateBookingStatus error:', err);
    return res.status(400).json({ message: err.message });
  }
};

// Creator cancels
export const cancelByCreator = async (req, res) => {
  try {
    const { reason } = cancelBookingSchema.parse(req.body);
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }

    booking.status = BOOKING_STATUS.CANCELLED_BY_CREATOR;
    if (reason) booking.reason = reason;

    booking.timeline.push({ by: req.user._id, action: 'cancelled_by_creator', note: reason });

    await booking.save();

    const io = req.app.get('io');
io.to(booking.designer.toString()).emit('bookingCancelled', {
  bookingId: booking._id,
  message: `Booking cancelled by creator`
});
    return res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Designer cancels after approval
export const cancelByDesigner = async (req, res) => {
  try {
    const { reason } = cancelBookingSchema.parse(req.body);
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!booking.designer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    if (booking.status !== BOOKING_STATUS.APPROVED) {
      return res.status(400).json({ message: 'Only approved bookings can be cancelled' });
    }

    booking.status = BOOKING_STATUS.CANCELLED_BY_DESIGNER;
    booking.reason = reason || 'Cancelled by designer';
    booking.timeline.push({ by: req.user._id, action: 'cancelled_by_designer', note: reason });

    await booking.save();
    const io = req.app.get('io');
io.to(booking.creator.toString()).emit('bookingCancelled', {
  bookingId: booking._id,
  message: `Booking cancelled by designer`
});
    return res.json({ message: 'Booking cancelled by designer', booking });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Auto-expire (cron job or background task later)
export const expireOldBookings = async () => {
  const now = new Date();
  await Booking.updateMany(
    { status: BOOKING_STATUS.PENDING, start: { $lt: now } },
    { $set: { status: BOOKING_STATUS.EXPIRED } }
  );
};
