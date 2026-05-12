/**
 * Venues API
 *
 * Routes:
 *   GET  /api/venues                              → { success, data: Venue[] }
 *     Query: ?sport=tennis&district=1&search=
 *   GET  /api/venues/:venueId                     → { success, data: Venue }
 *   GET  /api/venues/:venueId/slots?date=YYYY-MM-DD → { success, data: VenueSlot[] }
 *   POST /api/bookings                            → { success, data: Booking }
 *     Request: { venueId, sport, date, slotIds[], paymentMethod, notes, playerName }
 *   POST /api/bookings/:id/refund                 → { success, data: Booking }
 *   GET  /api/bookings                            → { success, data: Booking[] }
 */

import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import { isSlotBooked } from '../store/bookingStore';
import { getSlotOverride } from '../../owner/store/ownerStore';
import type { Venue, VenueSlot, Sport } from '../types/venues.types';

export interface UpsertVenuePayload {
  name: string;
  shortAddress: string;
  fullAddress: string;
  sports: Sport[];
  imageUrl: string;
  priceFrom: number;
  facilities: string[];
  openHours: string;
  description: string;
  courtCount: number;
  district: string;
}

const venueListeners = new Set<() => void>();

function emitVenuesChanged() {
  venueListeners.forEach((listener) => listener());
}

export function subscribeVenues(listener: () => void) {
  venueListeners.add(listener);
  return () => venueListeners.delete(listener);
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Mock venues ─────────────────────────────────────────────────────────────
export let MOCK_VENUES: Venue[] = [
  {
    id: 'v-001',
    name: 'District 1 Tennis Club',
    shortAddress: 'District 1, HCMC',
    fullAddress: '12 Nguyen Hue Blvd, Ben Nghe Ward, District 1, HCMC',
    sports: ['tennis'],
    rating: 4.9,
    reviewCount: 312,
    imageUrl: 'https://images.unsplash.com/photo-1761941336817-1c258e7ef78c?w=800&q=80',
    priceFrom: 120_000,
    facilities: ['Locker Room', 'Parking', 'Lighting', 'Equipment Rental', 'Cafe'],
    openHours: '06:00 – 22:00',
    description: 'Premium hard-surface tennis courts in the heart of District 1. Fully lit for night sessions with professional maintenance.',
    courtCount: 6,
    district: 'District 1',
  },
  {
    id: 'v-002',
    name: 'Binh Thanh Basketball Center',
    shortAddress: 'Binh Thanh, HCMC',
    fullAddress: '45 Dien Bien Phu St, Ward 25, Binh Thanh, HCMC',
    sports: ['basketball'],
    rating: 4.7,
    reviewCount: 189,
    imageUrl: 'https://images.unsplash.com/photo-1759694390162-bf13852b2650?w=800&q=80',
    priceFrom: 150_000,
    facilities: ['Air Conditioning', 'Locker Room', 'Scoreboard', 'Parking', 'Showers'],
    openHours: '07:00 – 23:00',
    description: 'Fully air-conditioned indoor basketball arena with professional flooring and NBA-standard backboards.',
    courtCount: 4,
    district: 'Binh Thanh',
  },
  {
    id: 'v-003',
    name: 'Go Vap Badminton Hall',
    shortAddress: 'Go Vap, HCMC',
    fullAddress: '88 Nguyen Oanh St, Ward 7, Go Vap, HCMC',
    sports: ['badminton'],
    rating: 4.8,
    reviewCount: 256,
    imageUrl: 'https://images.unsplash.com/photo-1775993167284-8e6a6e56ab69?w=800&q=80',
    priceFrom: 80_000,
    facilities: ['Air Conditioning', 'Equipment Rental', 'Parking', 'Pro Shop', 'Cafe'],
    openHours: '05:30 – 23:30',
    description: 'The largest badminton facility in Go Vap with 12 professional courts, Yonex equipment and certified coaching.',
    courtCount: 12,
    district: 'Go Vap',
  },
  {
    id: 'v-004',
    name: 'Thu Duc Football Complex',
    shortAddress: 'Thu Duc, HCMC',
    fullAddress: '233 Vo Van Ngan St, Thu Duc City, HCMC',
    sports: ['football'],
    rating: 4.6,
    reviewCount: 421,
    imageUrl: 'https://images.unsplash.com/photo-1776059462589-39863e08fbec?w=800&q=80',
    priceFrom: 200_000,
    facilities: ['Artificial Turf', 'Changing Room', 'Parking', 'Lighting', 'Referee Service'],
    openHours: '06:00 – 23:00',
    description: 'Modern 5v5 and 7v7 football fields with premium artificial turf. Popular for corporate leagues and weekend tournaments.',
    courtCount: 8,
    district: 'Thu Duc',
  },
  {
    id: 'v-005',
    name: 'District 7 Pickleball Club',
    shortAddress: 'District 7, HCMC',
    fullAddress: '18 Nguyen Thi Thap St, Tan Phu Ward, District 7, HCMC',
    sports: ['pickleball'],
    rating: 4.9,
    reviewCount: 143,
    imageUrl: 'https://images.unsplash.com/photo-1710772099352-f8fbb7b30977?w=800&q=80',
    priceFrom: 100_000,
    facilities: ['Air Conditioning', 'Equipment Rental', 'Coaching', 'Parking', 'Showers'],
    openHours: '07:00 – 22:00',
    description: 'Vietnam\'s top-rated pickleball facility with 8 indoor courts and professional coaching for all skill levels.',
    courtCount: 8,
    district: 'District 7',
  },
  {
    id: 'v-006',
    name: 'Vung Tau Beach Volleyball',
    shortAddress: 'Vung Tau City',
    fullAddress: 'Back Beach Zone, Ward 2, Vung Tau City',
    sports: ['volleyball'],
    rating: 4.7,
    reviewCount: 98,
    imageUrl: 'https://images.unsplash.com/photo-1585541115062-e91a6580c409?w=800&q=80',
    priceFrom: 90_000,
    facilities: ['Beach Courts', 'Changing Room', 'Equipment Rental', 'Sea View', 'Bar'],
    openHours: '06:00 – 20:00',
    description: 'Open-air beach volleyball courts right on Back Beach with stunning sea views. Perfect for casual games or competitive training.',
    courtCount: 6,
    district: 'Vung Tau',
  },
];

// ─── Generate time slots for a venue + date ──────────────────────────────────
export function generateSlots(venueId: string, date: string): VenueSlot[] {
  const venue = MOCK_VENUES.find(v => v.id === venueId);
  if (!venue) return [];

  const [openH] = venue.openHours.split(' – ')[0].split(':').map(Number);
  const [closeH] = venue.openHours.split(' – ')[1].split(':').map(Number);

  const slots: VenueSlot[] = [];
  const now = new Date();
  const selectedDate = new Date(date);
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  for (let h = openH; h < closeH; h++) {
    const startTime = `${String(h).padStart(2, '0')}:00`;
    const endTime = `${String(h + 1).padStart(2, '0')}:00`;
    const slotId = `${venueId}_${date}_${startTime}`;

    // Close past slots for today
    const isPast = isToday && h <= now.getHours();

    // Check owner overrides first
    const override = getSlotOverride(venueId, date, startTime);

    // Simulate some already-booked slots (deterministic by hash)
    const pseudoRandom = (venueId.charCodeAt(3) + h + date.charCodeAt(8)) % 7;
    const isMockBooked = !isPast && pseudoRandom === 0;

    let status: VenueSlot['status'] = 'available';
    if (isPast) status = 'closed';
    else if (override === 'locked' || override === 'unavailable') status = 'booked'; // appear as booked to players
    else if (isSlotBooked(venueId, date, startTime) || isMockBooked) status = 'booked';

    // Price varies by time-of-day (peak hours 17–21 are more expensive)
    const isPeak = h >= 17 && h <= 21;
    const price = isPeak ? venue.priceFrom * 1.5 : venue.priceFrom;

    slots.push({ id: slotId, venueId, date, startTime, endTime, price, status });
  }
  return slots;
}

// ─── Public API fns ──────────────────────────────────────────────────────────
export async function fetchVenues(filters?: {
  sport?: Sport | 'all';
  district?: string;
  search?: string;
}): Promise<{ success: boolean; data: Venue[] }> {
  if (isMockApi) {
    await delay(300);
    let data = [...MOCK_VENUES];
    if (filters?.sport && filters.sport !== 'all') {
      data = data.filter(v => v.sports.includes(filters.sport as Sport));
    }
    if (filters?.district && filters.district !== 'all') {
      data = data.filter(v => v.district === filters.district);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        v =>
          v.name.toLowerCase().includes(q) ||
          v.shortAddress.toLowerCase().includes(q) ||
          v.sports.some(s => s.includes(q))
      );
    }
    return { success: true, data };
  }
  const params = new URLSearchParams();
  if (filters?.sport && filters.sport !== 'all') params.set('sport', filters.sport);
  const res = await fetch(`${API_BASE_URL}/venues?${params}`);
  return res.json();
}

export async function fetchVenueById(venueId: string): Promise<{ success: boolean; data: Venue | null }> {
  if (isMockApi) {
    await delay(200);
    const venue = MOCK_VENUES.find(v => v.id === venueId) ?? null;
    return { success: true, data: venue };
  }
  const res = await fetch(`${API_BASE_URL}/venues/${venueId}`);
  return res.json();
}

export async function fetchSlots(
  venueId: string,
  date: string
): Promise<{ success: boolean; data: VenueSlot[] }> {
  if (isMockApi) {
    await delay(200);
    return { success: true, data: generateSlots(venueId, date) };
  }
  const res = await fetch(`${API_BASE_URL}/venues/${venueId}/slots?date=${date}`);
  return res.json();
}

export async function createVenue(payload: UpsertVenuePayload): Promise<{ success: boolean; data: Venue }> {
  if (isMockApi) {
    await delay(250);
    const districtLabel = payload.district.trim() || 'Unknown district';
    const venue: Venue = {
      id: `v-${Date.now()}`,
      name: payload.name,
      shortAddress: `${districtLabel}, HCMC`,
      fullAddress: payload.fullAddress,
      sports: payload.sports,
      rating: 4.8,
      reviewCount: 0,
      imageUrl: payload.imageUrl,
      priceFrom: payload.priceFrom,
      facilities: payload.facilities,
      openHours: payload.openHours,
      description: payload.description,
      courtCount: payload.courtCount,
      district: districtLabel,
    };
    MOCK_VENUES = [venue, ...MOCK_VENUES];
    emitVenuesChanged();
    return { success: true, data: venue };
  }

  const res = await fetch(`${API_BASE_URL}/owner/venues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateVenue(
  venueId: string,
  payload: UpsertVenuePayload
): Promise<{ success: boolean; data: Venue | null }> {
  if (isMockApi) {
    await delay(250);
    const idx = MOCK_VENUES.findIndex((venue) => venue.id === venueId);
    if (idx === -1) return { success: false, data: null };

    const districtLabel = payload.district.trim() || MOCK_VENUES[idx].district;
    const updated: Venue = {
      ...MOCK_VENUES[idx],
      ...payload,
      shortAddress: `${districtLabel}, HCMC`,
      district: districtLabel,
    };

    MOCK_VENUES = [...MOCK_VENUES];
    MOCK_VENUES[idx] = updated;
    emitVenuesChanged();
    return { success: true, data: updated };
  }

  const res = await fetch(`${API_BASE_URL}/owner/venues/${venueId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteVenue(venueId: string): Promise<{ success: boolean }> {
  if (isMockApi) {
    await delay(200);
    MOCK_VENUES = MOCK_VENUES.filter((venue) => venue.id !== venueId);
    emitVenuesChanged();
    return { success: true };
  }

  const res = await fetch(`${API_BASE_URL}/owner/venues/${venueId}`, { method: 'DELETE' });
  return res.json();
}