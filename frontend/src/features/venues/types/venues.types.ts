import type { Sport } from '../../discover/types/discover.types';

export type { Sport };

export type SlotStatus = 'available' | 'booked' | 'closed' | 'selected' | 'held' | 'unavailable' | 'refund_processing';
export type BookingStatus =
  | 'hold'
  | 'payment_pending'
  | 'confirmed'
  | 'refund_processing'
  | 'refunded'
  | 'refund_rejected'
  | 'expired';
export type PaymentMethod = 'card' | 'momo' | 'bank';
export type PaymentProvider = PaymentMethod | 'stub' | 'sepay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refund_pending' | 'refunded';
export type RefundStatus = 'pending_auto' | 'pending_manual' | 'approved' | 'rejected' | 'completed';
export type RefundMode = 'auto' | 'manual';

export interface VenueAvailabilitySummary {
  date: string;
  totalSlots: number;
  availableSlots: number;
  heldSlots: number;
  bookedSlots: number;
  unavailableSlots: number;
}

export interface VenueSlot {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: SlotStatus;
  bookingId?: string | null;
}

export interface Venue {
  id: string;
  ownerId?: string;
  name: string;
  shortAddress: string;
  fullAddress: string;
  phoneNumber: string;
  sports: Sport[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  priceFrom: number;
  openHours: string;
  description: string;
  courtCount: number;
  district: string;
  slotDurationMinutes?: number;
  availabilitySummary?: VenueAvailabilitySummary;
  weeklySchedule?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

export interface BookedSlotRef {
  slotId: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface VenuePayment {
  id: string;
  bookingId: string;
  amount: number;
  provider: PaymentProvider | string;
  providerReference: string;
  status: PaymentStatus | string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrCodeUrl?: string;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRefund {
  id: string;
  bookingId: string;
  paymentId: string;
  requestedBy: string;
  processedBy: string | null;
  type: string;
  status: RefundStatus | string;
  note: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  venueImage: string;
  venueAddress: string;
  venuePhone: string;
  sport: Sport;
  date: string;
  slots: BookedSlotRef[];
  totalPrice: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  holdExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  playerName: string;
  notes: string;
  payment?: VenuePayment | null;
  refund?: BookingRefund | null;
  refundMode?: RefundMode;
}
