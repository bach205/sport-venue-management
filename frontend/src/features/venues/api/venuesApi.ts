import { createAxiosInstance } from '@/shared/api/axiosBase';
import { isMockApi, API_BASE_URL } from '../../../shared/constants/api';
import { isSlotBooked } from '../store/bookingStore';
import { getSlotOverride } from '../../owner/store/ownerStore';
import type {
  Booking,
  BookingRefund,
  BookingStatus,
  PaymentMethod,
  RefundMode,
  SlotStatus,
  Sport,
  Venue,
  VenueAvailabilitySummary,
  VenuePayment,
  VenueSlot,
} from '../types/venues.types';

const api = createAxiosInstance(API_BASE_URL);

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

export interface FetchVenuesParams {
  page?: number;
  limit?: number;
  date?: string;
  sport?: Sport | 'all';
  district?: string;
  search?: string;
}

export interface FetchMyBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus | 'all';
}

export interface CreateBookingHoldPayload {
  venue_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface CreateBookingPaymentPayload {
  provider?: PaymentMethod | 'stub' | 'sepay';
  provider_reference?: string;
  return_url?: string;
}

export interface ConfirmBookingPaymentPayload {
  status: 'paid' | 'failed';
  provider_reference?: string;
  paid_at?: string;
}

export interface RequestBookingRefundPayload {
  note?: string;
}

export interface RefundResponse {
  mode: RefundMode;
  booking: Booking;
  payment: VenuePayment | null;
  refund: BookingRefund | null;
}

export interface FetchVenuesResult {
  items: Venue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const venueListeners = new Set<() => void>();

function emitVenuesChanged() {
  venueListeners.forEach((listener) => listener());
}

export function subscribeVenues(listener: () => void) {
  venueListeners.add(listener);
  return () => venueListeners.delete(listener);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_FACILITIES = ['Parking', 'Lighting'];
const DEFAULT_VENUE_IMAGE = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80';

const PAYMENT_METHOD_BY_PROVIDER: Record<string, PaymentMethod> = {
  card: 'card',
  momo: 'momo',
  bank: 'bank',
  sepay: 'bank',
  stub: 'card',
};

type BackendWeeklySchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type BackendAvailabilitySummary = VenueAvailabilitySummary;

type BackendVenue = {
  id: string;
  ownerId?: string;
  name: string;
  location: string;
  description: string;
  slotPrice: number;
  slotDurationMinutes: number;
  weeklySchedule?: BackendWeeklySchedule[];
  availabilitySummary?: BackendAvailabilitySummary;
  createdAt: string;
  updatedAt: string;
};

type BackendSlot = {
  date: string;
  startTime: string;
  endTime: string;
  price?: number;
  status: string;
  bookingId?: string | null;
};

type BackendPayment = {
  id: string;
  bookingId: string;
  amount: number;
  provider: string;
  providerReference: string;
  status: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  qrCodeUrl?: string;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendRefund = {
  id: string;
  bookingId: string;
  paymentId: string;
  requestedBy: string;
  processedBy: string | null;
  type: string;
  status: string;
  note: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendBooking = {
  id: string;
  status: BookingStatus;
  amount: number;
  holdExpiresAt: string | null;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  venue?: BackendVenue | null;
  user?: {
    id: string;
    email: string | null;
    name: string;
  } | null;
  payment?: BackendPayment | null;
  refund?: BackendRefund | null;
  createdAt: string;
  updatedAt: string;
};

function formatHoursLabel(time: string) {
  return time.slice(0, 5);
}

function formatOpenHours(schedule?: BackendWeeklySchedule[]) {
  if (!schedule?.length) return 'Flexible hours';

  const sorted = [...schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return `${formatHoursLabel(first.startTime)} – ${formatHoursLabel(last.endTime)}`;
}

function inferDistrict(location: string) {
  const segments = location.split(',').map((part) => part.trim()).filter(Boolean);
  return segments[segments.length - 2] || segments[segments.length - 1] || 'Unknown district';
}

function inferSports(name: string, description: string): Sport[] {
  const haystack = `${name} ${description}`.toLowerCase();
  const sports: Sport[] = [];

  if (haystack.includes('tennis')) sports.push('tennis');
  if (haystack.includes('basketball')) sports.push('basketball');
  if (haystack.includes('badminton')) sports.push('badminton');
  if (haystack.includes('football') || haystack.includes('soccer')) sports.push('football');
  if (haystack.includes('pickleball')) sports.push('pickleball');
  if (haystack.includes('volleyball')) sports.push('volleyball');

  return sports.length ? sports : ['tennis'];
}

function mapVenue(backendVenue: BackendVenue): Venue {
  const district = inferDistrict(backendVenue.location);

  return {
    id: backendVenue.id,
    ownerId: backendVenue.ownerId,
    name: backendVenue.name,
    shortAddress: district,
    fullAddress: backendVenue.location,
    sports: inferSports(backendVenue.name, backendVenue.description),
    rating: 4.8,
    reviewCount: 0,
    imageUrl: DEFAULT_VENUE_IMAGE,
    priceFrom: backendVenue.slotPrice,
    facilities: DEFAULT_FACILITIES,
    openHours: formatOpenHours(backendVenue.weeklySchedule),
    description: backendVenue.description,
    courtCount: backendVenue.weeklySchedule?.length || 1,
    district,
    slotDurationMinutes: backendVenue.slotDurationMinutes,
    availabilitySummary: backendVenue.availabilitySummary,
    weeklySchedule: backendVenue.weeklySchedule,
  };
}

function mapPayment(payment?: BackendPayment | null): VenuePayment | null {
  if (!payment) return null;
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amount: payment.amount,
    provider: payment.provider,
    providerReference: payment.providerReference,
    status: payment.status,
    bankName: payment.bankName || '',
    bankAccountNumber: payment.bankAccountNumber || '',
    bankAccountName: payment.bankAccountName || '',
    qrCodeUrl: payment.qrCodeUrl || '',
    paidAt: payment.paidAt,
    refundedAt: payment.refundedAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

function mapRefund(refund?: BackendRefund | null): BookingRefund | null {
  if (!refund) return null;
  return {
    id: refund.id,
    bookingId: refund.bookingId,
    paymentId: refund.paymentId,
    requestedBy: refund.requestedBy,
    processedBy: refund.processedBy,
    type: refund.type,
    status: refund.status,
    note: refund.note,
    processedAt: refund.processedAt,
    createdAt: refund.createdAt,
    updatedAt: refund.updatedAt,
  };
}

function mapBooking(backendBooking: BackendBooking): Booking {
  const venue = backendBooking.venue ? mapVenue(backendBooking.venue) : null;
  const payment = mapPayment(backendBooking.payment);
  const refund = mapRefund(backendBooking.refund);

  return {
    id: backendBooking.id,
    venueId: venue?.id || '',
    venueName: venue?.name || 'Venue booking',
    venueImage: venue?.imageUrl || DEFAULT_VENUE_IMAGE,
    venueAddress: venue?.fullAddress || 'Venue address unavailable',
    sport: venue?.sports[0] || 'tennis',
    date: backendBooking.slot.date,
    slots: [
      {
        slotId: `${backendBooking.id}_${backendBooking.slot.date}_${backendBooking.slot.startTime}`,
        startTime: backendBooking.slot.startTime,
        endTime: backendBooking.slot.endTime,
        price: backendBooking.amount,
      },
    ],
    totalPrice: backendBooking.amount,
    status: backendBooking.status,
    paymentMethod: PAYMENT_METHOD_BY_PROVIDER[payment?.provider || 'stub'] || 'card',
    paidAt: payment?.paidAt || null,
    holdExpiresAt: backendBooking.holdExpiresAt,
    createdAt: backendBooking.createdAt,
    updatedAt: backendBooking.updatedAt,
    playerName: backendBooking.user?.name || 'You',
    notes: refund?.note || '',
    payment,
    refund,
  };
}

function mapSlotStatus(status: string): SlotStatus {
  switch (status) {
    case 'available':
      return 'available';
    case 'held':
      return 'held';
    case 'unavailable':
      return 'unavailable';
    case 'refund_processing':
      return 'refund_processing';
    case 'booked':
      return 'booked';
    default:
      return 'closed';
  }
}

function mapSlot(venueId: string, backendSlot: BackendSlot, slotPrice: number): VenueSlot {
  return {
    id: `${venueId}_${backendSlot.date}_${backendSlot.startTime}`,
    venueId,
    date: backendSlot.date,
    startTime: backendSlot.startTime,
    endTime: backendSlot.endTime,
    price: backendSlot.price ?? slotPrice,
    status: mapSlotStatus(backendSlot.status),
    bookingId: backendSlot.bookingId ?? null,
  };
}

function normalizeSearchText(value?: string) {
  return value?.trim().toLowerCase() || '';
}

function filterVenueList(venues: Venue[], filters?: Pick<FetchVenuesParams, 'sport' | 'district' | 'search'>) {
  const search = normalizeSearchText(filters?.search);

  return venues.filter((venue) => {
    if (filters?.sport && filters.sport !== 'all' && !venue.sports.includes(filters.sport)) return false;
    if (filters?.district && filters.district !== 'all' && venue.district !== filters.district) return false;
    if (!search) return true;

    return (
      venue.name.toLowerCase().includes(search) ||
      venue.shortAddress.toLowerCase().includes(search) ||
      venue.fullAddress.toLowerCase().includes(search) ||
      venue.sports.some((sport) => sport.includes(search))
    );
  });
}

// Mock data retained for owner UI compatibility.
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
];

export function generateSlots(venueId: string, date: string): VenueSlot[] {
  const venue = MOCK_VENUES.find((v) => v.id === venueId);
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
    const isPast = isToday && h <= now.getHours();
    const override = getSlotOverride(venueId, date, startTime);
    const pseudoRandom = (venueId.charCodeAt(3) + h + date.charCodeAt(8)) % 7;
    const isMockBooked = !isPast && pseudoRandom === 0;

    let status: VenueSlot['status'] = 'available';
    if (isPast) status = 'closed';
    else if (override === 'locked' || override === 'unavailable') status = 'booked';
    else if (isSlotBooked(venueId, date, startTime) || isMockBooked) status = 'booked';

    const isPeak = h >= 17 && h <= 21;
    const price = isPeak ? venue.priceFrom * 1.5 : venue.priceFrom;
    slots.push({ id: slotId, venueId, date, startTime, endTime, price, status });
  }

  return slots;
}

export async function fetchVenues(filters?: FetchVenuesParams): Promise<FetchVenuesResult> {
  if (isMockApi) {
    await delay(300);
    const data = filterVenueList([...MOCK_VENUES], filters);
    return {
      items: data,
      pagination: {
        page: filters?.page ?? 1,
        limit: filters?.limit ?? data.length,
        total: data.length,
        pages: 1,
      },
    };
  }

  const params: Record<string, string | number> = {};
  if (filters?.page) params.page = filters.page;
  if (filters?.limit) params.limit = filters.limit;
  if (filters?.date) params.date = filters.date;

  const res = await api.get<{ message: string; data: { items: BackendVenue[]; pagination: FetchVenuesResult['pagination'] } }>('/venues', {
    params,
  });

  const mappedItems = res.data.data.items.map(mapVenue);
  const filteredItems = filterVenueList(mappedItems, filters);

  return {
    items: filteredItems,
    pagination: {
      ...res.data.data.pagination,
      total: filteredItems.length,
      pages: Math.max(1, Math.ceil(filteredItems.length / (res.data.data.pagination.limit || filteredItems.length || 1))),
    },
  };
}

export async function fetchVenueById(venueId: string, date?: string): Promise<Venue | null> {
  if (isMockApi) {
    await delay(200);
    return MOCK_VENUES.find((venue) => venue.id === venueId) ?? null;
  }

  const venueList = await fetchVenues({ page: 1, limit: 100, date });
  return venueList.items.find((venue) => venue.id === venueId) ?? null;
}

export async function fetchVenueSlots(venueId: string, date: string): Promise<{ venue: Venue | null; date: string; slots: VenueSlot[] }> {
  if (isMockApi) {
    await delay(200);
    const venue = MOCK_VENUES.find((item) => item.id === venueId) ?? null;
    return { venue, date, slots: generateSlots(venueId, date) };
  }

  const res = await api.get<{ message: string; data: { venue: BackendVenue; date: string; slots: BackendSlot[] } }>(`/venues/${venueId}/slots`, {
    params: { date },
  });

  const venue = mapVenue(res.data.data.venue);
  return {
    venue,
    date: res.data.data.date,
    slots: res.data.data.slots.map((slot) => mapSlot(venueId, slot, venue.priceFrom)),
  };
}

export async function createBookingHold(payload: CreateBookingHoldPayload): Promise<{ booking: Booking; payment: VenuePayment | null }> {
  const res = await api.post<{ message: string; data: { booking: BackendBooking; payment: BackendPayment | null } }>('/bookings/holds', payload);
  return {
    booking: mapBooking(res.data.data.booking),
    payment: mapPayment(res.data.data.payment),
  };
}

export async function createBookingPayment(bookingId: string, payload: CreateBookingPaymentPayload): Promise<{ booking: Booking; payment: VenuePayment | null }> {
  const res = await api.post<{ message: string; data: { booking: BackendBooking; payment: BackendPayment | null } }>(`/bookings/${bookingId}/payments`, payload);
  return {
    booking: mapBooking(res.data.data.booking),
    payment: mapPayment(res.data.data.payment),
  };
}

export async function fetchPaymentStatus(paymentId: string): Promise<{ booking: Booking; payment: VenuePayment | null }> {
  const res = await api.get<{ message: string; data: { booking: BackendBooking; payment: BackendPayment | null } }>(`/payments/${paymentId}`);
  return {
    booking: mapBooking(res.data.data.booking),
    payment: mapPayment(res.data.data.payment),
  };
}

export async function confirmBookingPayment(paymentId: string, payload: ConfirmBookingPaymentPayload): Promise<{ booking: Booking; payment: VenuePayment | null }> {
  const res = await api.post<{ message: string; data: { acknowledged: true; booking: BackendBooking; payment: BackendPayment | null } }>(`/payments/${paymentId}/confirm`, payload);
  return {
    booking: mapBooking(res.data.data.booking),
    payment: mapPayment(res.data.data.payment),
  };
}

export async function fetchMyBookings(params?: FetchMyBookingsParams): Promise<{ items: Booking[]; pagination: FetchVenuesResult['pagination'] }> {
  const query: Record<string, string | number> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.status && params.status !== 'all') query.status = params.status;

  const res = await api.get<{ message: string; data: { items: BackendBooking[]; pagination: FetchVenuesResult['pagination'] } }>('/bookings/me', {
    params: query,
  });

  return {
    items: res.data.data.items.map(mapBooking),
    pagination: res.data.data.pagination,
  };
}

export async function requestBookingRefund(bookingId: string, payload: RequestBookingRefundPayload): Promise<RefundResponse> {
  const res = await api.post<{ message: string; data: { mode: RefundMode; booking: BackendBooking; payment: BackendPayment | null; refund: BackendRefund | null } }>(`/bookings/${bookingId}/refund`, payload);
  return {
    mode: res.data.data.mode,
    booking: mapBooking(res.data.data.booking),
    payment: mapPayment(res.data.data.payment),
    refund: mapRefund(res.data.data.refund),
  };
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

export async function updateVenue(venueId: string, payload: UpsertVenuePayload): Promise<{ success: boolean; data: Venue | null }> {
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
