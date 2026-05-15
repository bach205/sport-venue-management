import { createAxiosInstance } from "@/shared/api/axiosBase";
import { isMockApi, API_BASE_URL } from "../../../shared/constants/api";

const api = createAxiosInstance(API_BASE_URL);

export type OwnerVenue = {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  description: string;
  slotPrice: number;
  slotDurationMinutes: number;
  weeklySchedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type OwnerBooking = {
  id: string;
  status: string;
  amount: number;
  holdExpiresAt: string | null;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  venue?: OwnerVenue;
  user?: {
    id: string;
    email: string | null;
    name: string;
  } | null;
  payment?: {
    id: string;
    bookingId: string;
    amount: number;
    provider: string;
    providerReference: string;
    status: string;
    paidAt: string | null;
    refundedAt: string | null;
  } | null;
  refund?: {
    id: string;
    bookingId: string;
    paymentId: string;
    requestedBy: string;
    processedBy: string | null;
    type: string;
    status: string;
    note: string;
    processedAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerRefundRequest = {
  id: string;
  bookingId: string;
  paymentId: string;
  requestedBy: string;
  processedBy: string | null;
  type: string;
  status: string;
  note: string;
  processedAt: string | null;
  booking: OwnerBooking | null;
  payment: OwnerBooking["payment"];
  requester: {
    id: string;
    email: string | null;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnerSlot = {
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
};

export type CreateVenuePayload = {
  name: string;
  location: string;
  description: string;
  slot_price: number;
  slot_duration_minutes: number;
  weekly_schedule: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
};

export type UpdateVenuePayload = Partial<Pick<CreateVenuePayload, "name" | "location" | "description">>;

export async function fetchOwnerVenues() {
  const res = await api.get<{ message: string; data: { items: OwnerVenue[] } }>("/my-venues");
  return res.data.data.items;
}

export async function createOwnerVenue(payload: CreateVenuePayload) {
  const res = await api.post<{ message: string; data: OwnerVenue }>("/my-venues", payload);
  return res.data.data;
}

export async function updateOwnerVenue(venueId: string, payload: UpdateVenuePayload) {
  const res = await api.patch<{ message: string; data: OwnerVenue }>(`/my-venues/${venueId}`, payload);
  return res.data.data;
}

export async function deleteOwnerVenue(venueId: string) {
  const res = await api.delete<{ message: string; data: { id: string } }>(`/my-venues/${venueId}`);
  return res.data.data;
}

export async function updateOwnerVenueSchedule(
  venueId: string,
  payload: {
    slot_price: number;
    slot_duration_minutes: number;
    weekly_schedule: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
    }>;
  }
) {
  const res = await api.put<{ message: string; data: OwnerVenue }>(`/my-venues/${venueId}/schedule`, payload);
  return res.data.data;
}

export async function fetchOwnerVenueBookings(venueId: string, params?: { date?: string; status?: string }) {
  const res = await api.get<{ message: string; data: { venue: OwnerVenue; items: OwnerBooking[] } }>(
    `/my-venues/${venueId}/bookings`,
    { params }
  );
  return res.data.data;
}

export async function fetchOwnerRefundRequests(venueId: string, params?: { status?: string }) {
  const res = await api.get<{ message: string; data: { items: OwnerRefundRequest[] } }>(
    `/my-venues/${venueId}/refund-requests`,
    { params }
  );
  return res.data.data.items;
}

export async function resolveOwnerRefund(refundId: string, payload: { action: "approve" | "reject"; note?: string }) {
  const res = await api.patch<{ message: string; data: { booking: OwnerBooking; refund: OwnerRefundRequest["booking"] extends never ? never : any; payment: any } }>(
    `/my-venues/refund-requests/${refundId}`,
    payload
  );
  return res.data.data;
}

export async function fetchVenueSlotsByDate(venueId: string, date: string) {
  const res = await api.get<{ message: string; data: { venue: OwnerVenue; date: string; slots: OwnerSlot[] } }>(
    `/venues/${venueId}/slots`,
    { params: { date } }
  );
  return res.data.data;
}

export async function updateOwnerAvailability(
  venueId: string,
  payload: {
    date: string;
    start_time: string;
    end_time: string;
    status: "available" | "unavailable";
    reason?: string;
  }
) {
  const res = await api.put<{ message: string; data: { venue: OwnerVenue; date: string; slot: OwnerSlot } }>(
    `/my-venues/${venueId}/availability`,
    payload
  );
  return res.data.data;
}
