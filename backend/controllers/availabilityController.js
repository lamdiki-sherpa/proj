// controllers/availabilityController.js
import { User } from '../models/User.js';
import { Booking, BOOKING_STATUS } from '../models/Booking.js';
import { generateSlotsForDay, removeConflicts } from '../services/time.js';
import { updateAvailabilitySchema } from '../validators/booking.js';

// Designer updates working hours & blocked dates
export const updateAvailability = async (req, res) => {
  try {
    const parsed = updateAvailabilitySchema.parse(req.body);

    const user = req.user;
    if (user.role !== 'designer') {
      return res.status(403).json({ message: 'Only designers can update availability' });
    }

    user.availability = {
      ...user.availability.toObject(),
      ...parsed
    };

    await user.save();
    return res.json({ message: 'Availability updated', availability: user.availability });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Get available slots for a designer on a given date
export const getAvailableSlots = async (req, res) => {
  try {
    const { designerId, date } = req.query;
    if (!designerId || !date) return res.status(400).json({ message: 'designerId & date required' });

    const designer = await User.findById(designerId);
    if (!designer || designer.role !== 'designer') return res.status(404).json({ message: 'Designer not found' });

    const day = new Date(date);
    const slots = generateSlotsForDay(day, designer.availability.workingHours);

    // get blocked dates set
    const blockedSet = new Set((designer.availability.unavailableDates || []).map(d => new Date(d).toISOString().slice(0,10)));

    // get existing bookings
    const bookings = await Booking.find({
      designer: designerId,
      status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED] },
      start: { $gte: new Date(day.setHours(0,0,0,0)) },
      end: { $lt: new Date(day.setHours(23,59,59,999)) }
    });

    const available = removeConflicts(slots, blockedSet, bookings);
    return res.json({ date: date, slots: available });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
