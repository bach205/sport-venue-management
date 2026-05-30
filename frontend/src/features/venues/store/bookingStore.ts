/**
 * Booking In-Memory Store
 * - Manages booked slots per venue per date (anti-double-booking)
 * - Stores booking history for the session
 * - Refund window: 5 minutes from paidAt
 *
 * Real API Routes:
 *   GET  /api/venues/:venueId/slots?date=YYYY-MM-DD   → { data: VenueSlot[] }
 *   POST /api/bookings                                 → { data: Booking }
 *     Request: { venueId, sport, date, slotIds[], paymentMethod, notes }
 *   GET  /api/bookings                                 → { data: Booking[] }
 *   POST /api/bookings/:id/refund                      → { data: Booking }
 */

import type { Booking, BookedSlotRef, Sport, PaymentMethod } from '../types/venues.types';

// ─── booked slot set: "venueId|date|startTime" → bookingId ───────────────────
const bookedSlots = new Map<string, string>();

// ─── booking list ─────────────────────────────────────────────────────────────
let bookings: Booking[] = [];

// Refund window in ms (5 minutes)
export const REFUND_WINDOW_MS = 5 * 60 * 1000;

function makeSlotKey(venueId: string, date: string, startTime: string) {
  return `${venueId}|${date}|${startTime}`;
}

/** Returns true when a slot is already booked for this venue/date */
export function isSlotBooked(venueId: string, date: string, startTime: string): boolean {
  return bookedSlots.has(makeSlotKey(venueId, date, startTime));
}

/** Create a new booking and mark all its slots as taken */
export function createBooking(params: {
  venueId: string;
  venueName: string;
  venueImage: string;
  venueAddress: string;
  sport: Sport;
  date: string;
  slots: BookedSlotRef[];
  paymentMethod: PaymentMethod;
  notes: string;
  playerName: string;
}): Booking {
  const now = new Date().toISOString();
  const id = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const totalPrice = params.slots.reduce((sum, s) => sum + s.price, 0);

  const booking: Booking = {
    id,
    venueId: params.venueId,
    venueName: params.venueName,
    venueImage: params.venueImage,
    venueAddress: params.venueAddress,
    sport: params.sport,
    date: params.date,
    slots: params.slots,
    totalPrice,
    status: 'confirmed',
    paymentMethod: params.paymentMethod,
    paidAt: now,
    createdAt: now,
    updatedAt: now,
    playerName: params.playerName,
    notes: params.notes,
  };

  // Mark slots as booked
  for (const slot of params.slots) {
    bookedSlots.set(makeSlotKey(params.venueId, params.date, slot.startTime), id);
  }

  bookings = [booking, ...bookings];
  return booking;
}

/** Get all bookings (newest first) */
export function getBookings(): Booking[] {
  return [...bookings];
}

/** Get single booking */
export function getBookingById(id: string): Booking | undefined {
  return bookings.find(b => b.id === id);
}

/** Returns ms remaining in refund window (0 if expired) */
export function getRefundWindowRemaining(booking: Booking): number {
  if (!booking.paidAt) return 0;
  const elapsed = Date.now() - new Date(booking.paidAt).getTime();
  return Math.max(0, REFUND_WINDOW_MS - elapsed);
}

/** Request refund. Returns updated booking or null if window expired */
export function requestRefund(bookingId: string): Booking | null {
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return null;

  const booking = bookings[idx];
  const remaining = getRefundWindowRemaining(booking);
  if (remaining <= 0) return null; // window expired

  // Release slots
  for (const slot of booking.slots) {
    bookedSlots.delete(makeSlotKey(booking.venueId, booking.date, slot.startTime));
  }

  const updated: Booking = { ...booking, status: 'refund_processing' };
  bookings = [...bookings];
  bookings[idx] = updated;
  return updated;
}

/** Owner manually approves refund — bypasses time window check */
export function ownerApproveRefund(bookingId: string): Booking | null {
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return null;

  const booking = bookings[idx];
  if (booking.status !== 'confirmed') return null;

  for (const slot of booking.slots) {
    bookedSlots.delete(makeSlotKey(booking.venueId, booking.date, slot.startTime));
  }

  const updated: Booking = { ...booking, status: 'refund_processing' };
  bookings = [...bookings];
  bookings[idx] = updated;
  return updated;
}

export function ownerRejectRefund(bookingId: string): Booking | null {
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) return null;

  const booking = bookings[idx];
  if (booking.status !== 'confirmed') return null;

  const updated: Booking = { ...booking, status: 'confirmed' };
  bookings = [...bookings];
  bookings[idx] = updated;
  return updated;
}
