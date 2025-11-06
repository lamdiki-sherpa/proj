// services/time.js
import { DateTime, Interval } from 'luxon';

export const ZONE = 'Asia/Kathmandu';   
export const SLOT_MINUTES = 60;         

// convert JS Date → Luxon DateTime in zone
export function toZ(dt) {
  return DateTime.fromJSDate(dt, { zone: ZONE });
}
export function fromISO(iso) {
  return DateTime.fromISO(iso, { zone: ZONE });
}


export function js(dt) {
  return dt.toJSDate();
}


export function generateSlotsForDay(dayJSDate, workingHours) {
  const day = toZ(dayJSDate);
  const dow = ['sun','mon','tue','wed','thu','fri','sat'][day.weekday % 7]; // Luxon: 1=Mon..7=Sun
  const rule = workingHours?.[dow];
  if (!rule || !rule.start || !rule.end) return [];

  const start = day.set({
    hour: Number(rule.start.slice(0,2)),
    minute: Number(rule.start.slice(3,5)),
    second: 0, millisecond: 0
  });
  const end = day.set({
    hour: Number(rule.end.slice(0,2)),
    minute: Number(rule.end.slice(3,5)),
    second: 0, millisecond: 0
  });

  const slots = [];
  let cursor = start;
  while (cursor.plus({ minutes: SLOT_MINUTES }) <= end) {
    const s = cursor;
    const e = cursor.plus({ minutes: SLOT_MINUTES });
    slots.push({ start: js(s), end: js(e) });
    cursor = e;
  }
  return slots;
}


export function removeConflicts(slots, blockedISOSet, existingBookings) {
  return slots.filter(({start, end}) => {
    const s = toZ(start), e = toZ(end);

    
    const key = s.toISODate(); // "YYYY-MM-DD"
    if (blockedISOSet.has(key)) return false;

    // check overlaps with pending/approved bookings
    return existingBookings.every(b => {
      const bi = Interval.fromDateTimes(toZ(b.start), toZ(b.end));
      const si = Interval.fromDateTimes(s, e);
      return !bi.overlaps(si);
    });
  });
}

/**
 * Quick conflict check for one slot
 */
export function hasConflict(start, end, blockedISOSet, existingBookings) {
  return removeConflicts([{ start, end }], blockedISOSet, existingBookings).length === 0;
}
