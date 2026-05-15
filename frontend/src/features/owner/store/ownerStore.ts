/**
 * Owner Store
 * - Manages slot overrides (locked / unavailable) per venue
 * - Owner-side refund approval (manual, > 5 min)
 *
 * Real API Routes:
 *   GET  /api/owner/venues                             → { data: Venue[] }
 *   GET  /api/owner/venues/:id/bookings                → { data: Booking[] }
 *   POST /api/owner/bookings/:id/approve-refund        → { data: Booking }
 *   POST /api/owner/bookings/:id/reject-refund         → { data: Booking }
 *   POST /api/owner/venues/:id/slots/override          → { data: SlotOverride }
 *     Body: { date, startTime, action: 'lock' | 'unavailable' | 'open' }
 *   DELETE /api/owner/venues/:id/slots/override/:slotKey → { success }
 */

export type SlotOverride = 'locked' | 'unavailable';

/** key: "venueId|date|startTime" → override type */
const overrides = new Map<string, SlotOverride>();

/** Refund requests awaiting owner approval: bookingId → 'pending' | 'approved' | 'rejected' */
const ownerRefundRequests = new Map<string, 'pending' | 'approved' | 'rejected'>();

const _listeners = new Set<() => void>();
function emit() { _listeners.forEach(fn => fn()); }

export function subscribeOwner(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ─── Slot Overrides ──────────────────────────────────────────────────────────
function key(venueId: string, date: string, startTime: string) {
  return `${venueId}|${date}|${startTime}`;
}

export function getSlotOverride(venueId: string, date: string, startTime: string): SlotOverride | null {
  return overrides.get(key(venueId, date, startTime)) ?? null;
}

export function setSlotOverride(venueId: string, date: string, startTime: string, type: SlotOverride) {
  overrides.set(key(venueId, date, startTime), type);
  emit();
}

export function clearSlotOverride(venueId: string, date: string, startTime: string) {
  overrides.delete(key(venueId, date, startTime));
  emit();
}

export function getOverridesForVenueDate(venueId: string, date: string): Map<string, SlotOverride> {
  const result = new Map<string, SlotOverride>();
  for (const [k, v] of overrides.entries()) {
    if (k.startsWith(`${venueId}|${date}|`)) {
      const startTime = k.split('|')[2];
      result.set(startTime, v);
    }
  }
  return result;
}

// ─── Owner Refund Requests ───────────────────────────────────────────────────
export function getPendingRefundStatus(bookingId: string): 'pending' | 'approved' | 'rejected' | null {
  return ownerRefundRequests.get(bookingId) ?? null;
}

export function setRefundDecision(bookingId: string, decision: 'approved' | 'rejected') {
  ownerRefundRequests.set(bookingId, decision);
  emit();
}

export function getAllRefundDecisions(): Map<string, 'pending' | 'approved' | 'rejected'> {
  return new Map(ownerRefundRequests);
}
