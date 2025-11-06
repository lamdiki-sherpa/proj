import { Booking } from '../models/Booking.js';
import { dayKeyFromUTCIndex, weekdayUTC, toISODate, overlaps } from './dates.js';


export async function getAvailableSlotsForDesigner(designer, startDate, endDate, slotMinutes = 60) {
  const start = toISODate(startDate);
  const end = toISODate(endDate);
  const days = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }

  // Pull bookings that might block slots in this range
  const bookings = await Booking.find({
    designer: designer._id,
    status: { $in: ['pending', 'approved'] },
    startUtc: { $lt: new Date(end.getTime() + 24 * 60 * 60 * 1000) },
    endUtc: { $gt: start }
  });

  const unavailableISO = new Set((designer.availability?.unavailableDates || []).map(d => toISODate(d).toISOString()));

  const result = [];

  for (const day of days) {
    const wd = weekdayUTC(day);
    const key = dayKeyFromUTCIndex(wd);
    const wh = designer.availability?.workingHours?.[key];

    // Skip if day is fully blocked
    if (unavailableISO.has(toISODate(day).toISOString()) || !wh?.start || !wh?.end) {
      result.push({ date: day.toISOString().slice(0,10), slots: [] });
      continue;
    }

    // Build candidate slots
    const [sh, sm] = wh.start.split(':').map(Number);
    const [eh, em] = wh.end.split(':').map(Number);
    const dayStart = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), sh, sm || 0));
    const dayEnd   = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), eh, em || 0));

    const slots = [];
    for (let t = new Date(dayStart); t < dayEnd; t = new Date(t.getTime() + slotMinutes * 60000)) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t.getTime() + slotMinutes * 60000);
      if (slotEnd > dayEnd) break;

      const blocked = bookings.some(b => overlaps(slotStart, slotEnd, b.startUtc, b.endUtc));
      if (!blocked) {
        slots.push({ startUtc: slotStart, endUtc: slotEnd });
      }
    }
    result.push({ date: day.toISOString().slice(0,10), slots });
  }

  return result;
}