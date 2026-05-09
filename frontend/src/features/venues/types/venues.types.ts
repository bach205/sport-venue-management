import type { Sport } from '../../discover/types/discover.types';

export type { Sport };

export type SlotStatus = 'available' | 'booked' | 'closed' | 'selected';
export type BookingStatus = 'confirmed' | 'processing_refund' | 'refunded' | 'cancelled';
export type PaymentMethod = 'card' | 'momo' | 'bank';

export interface VenueSlot {
  id: string;       // e.g. "v1_2026-05-09_08:00"
  venueId: string;
  date: string;     // "YYYY-MM-DD"
  startTime: string;// "08:00"
  endTime: string;  // "09:00"
  price: number;    // VND
  status: SlotStatus;
}

export interface VenueFacility {
  icon: string;
  label: string;
}

export interface Venue {
  id: string;
  name: string;
  shortAddress: string;
  fullAddress: string;
  sports: Sport[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  priceFrom: number;      // VND per hour
  facilities: string[];
  openHours: string;      // "06:00 – 22:00"
  description: string;
  courtCount: number;
  district: string;
}

export interface BookedSlotRef {
  slotId: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  venueImage: string;
  venueAddress: string;
  sport: Sport;
  date: string;           // "YYYY-MM-DD"
  slots: BookedSlotRef[];
  totalPrice: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paidAt: string;         // ISO datetime — used for 5-min refund window
  createdAt: string;
  playerName: string;
  notes: string;
}
