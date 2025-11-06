// controllers/calendarController.js
import createError from 'http-errors';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { generateSlotsForDay, removeConflicts, ZONE, toZ } from '../services/time.js';
import { DateTime } from 'luxon';

export const getBookableSlots = async (req, res, next) => {
  try {
    const { designerId } = req.params;
    const { startDate, endDate } = req.query; // YYYY-MM-DD inclusive

    const designer = await User.findOne({ _id: designerId, role: 'designer' })
      .select('availability');
    if (!designer) return next(createError(404, 'Designer not found'));

    const start = DateTime.fromISO(startDate, { zone: ZONE }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: ZONE }).endOf('day');
    if (!start.isValid || !end.isValid || end < start) return next(createError(400, 'Invalid range'));

    // build blocked set
    const blocked = new Set(
      (designer.availability?.unavailableDates || []).map(d => toZ(d).toISODate())
    );

    // fetch pending/approved bookings in range
    const bookings = await Booking.find({
      designer: designerId,
      status: { $in: ['pending','approved'] },
      start: { $lte: end.toJSDate() },
      end: { $gte: start.toJSDate() }
    }).select('start end');

    // build slots per day
    const days = [];
    let cursor = start;
    while (cursor <= end) {
      const daySlots = generateSlotsForDay(cursor.toJSDate(), designer.availability?.workingHours);
      const free = removeConflicts(daySlots, blocked, bookings);
      days.push({
        date: cursor.toISODate(),
        slots: free.map(s => ({ start: s.start, end: s.end }))
      });
      cursor = cursor.plus({ days: 1 });
    }

    res.json({ days, zone: ZONE });
  } catch (err) { next(err); }
};
