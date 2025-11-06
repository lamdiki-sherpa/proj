// validators/booking.js
import { z } from 'zod';


export const createBookingSchema = z.object({
  designerId: z.string().min(1, 'Designer ID required'),
  start: z.string().datetime({ offset: true }), // ISO datetime
  end: z.string().datetime({ offset: true }),
});


export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'approved',
    'declined',
    'cancelledByDesigner'
  ]),
  reason: z.string().optional(), 
});

// creator cancels own booking
export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

// designer updates availability
export const updateAvailabilitySchema = z.object({
  workingHours: z.object({
    mon: z.object({ start: z.string(), end: z.string() }).partial().optional(),
    tue: z.object({ start: z.string(), end: z.string() }).partial().optional(),
    wed: z.object({ start: z.string(), end: z.string() }).partial().optional(),
    thu: z.object({ start: z.string(), end: z.string() }).partial().optional(),
    fri: z.object({ start: z.string(), end: z.string() }).partial().optional(),
    sat: z.object({ start: z.string(), end: z.string() }).partial().optional(),
    sun: z.object({ start: z.string(), end: z.string() }).partial().optional(),
  }).partial(),
  unavailableDates: z.array(z.string().date()).optional()
});
