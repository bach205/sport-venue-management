import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchVenueById, fetchVenueSlots } from '../api/venuesApi';
import { SlotGrid } from '../components/SlotGrid';
import { BookingModal } from '../components/BookingModal';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import type { Venue, VenueSlot, Booking } from '../types/venues.types';

const SPORT_EMOJI: Record<string, string> = {
  tennis: '🎾',
  basketball: '🏀',
  badminton: '🏸',
  football: '⚽',
  pickleball: '🏓',
  volleyball: '🏐',
};

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function getAvailabilitySummary(slots: VenueSlot[], date: string) {
  return {
    date,
    totalSlots: slots.length,
    availableSlots: slots.filter(slot => slot.status === 'available').length,
    heldSlots: slots.filter(slot => slot.status === 'held').length,
    bookedSlots: slots.filter(slot => slot.status === 'booked').length,
    unavailableSlots: slots.filter(slot => slot.status === 'unavailable' || slot.status === 'closed').length,
  };
}

function SummaryChip({ label, value, tone }: { label: string; value: number; tone: 'green' | 'orange' | 'gray' | 'brown' }) {
  const styles = {
    green: { background: '#e7f8f7', color: '#006a65', border: '1px solid rgba(0,106,101,0.18)' },
    orange: { background: '#fff1eb', color: '#a04100', border: '1px solid rgba(160,65,0,0.15)' },
    gray: { background: '#f7f0ed', color: '#8b7266', border: '1px solid #e8c4b3' },
    brown: { background: '#f4ded5', color: '#584238', border: '1px solid #dfc0b3' },
  } as const;

  return (
    <div className="px-3 py-2 rounded-xl" style={styles[tone]}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700 }}>{value}</p>
    </div>
  );
}

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [venueLoading, setVenueLoading] = useState(true);

  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);

  const weekStart = addDays(today, weekOffset * 7);
  const dateTabs = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDate = dateTabs[selectedDateIdx];
  const selectedDateStr = toISODate(selectedDate);

  const [slots, setSlots] = useState<VenueSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!venueId) return;
    setVenueLoading(true);
    fetchVenueById(venueId, selectedDateStr)
      .then((data) => {
        setVenue(data);
      })
      .finally(() => {
        setVenueLoading(false);
      });
  }, [venueId, selectedDateStr]);

  useEffect(() => {
    if (!venueId) return;
    setSelectedSlotIds([]);
    setSlotsLoading(true);
    fetchVenueSlots(venueId, selectedDateStr)
      .then((res) => {
        setSlots(res.slots);
        if (res.venue) {
          setVenue({
            ...(venue ?? res.venue),
            ...res.venue,
            availabilitySummary: res.venue.availabilitySummary ?? getAvailabilitySummary(res.slots, selectedDateStr),
          });
        }
      })
      .finally(() => {
        setSlotsLoading(false);
      });
  }, [venueId, selectedDateStr]);

  const handleToggleSlot = (slot: VenueSlot) => {
    const slotStart = new Date(`${slot.date}T${slot.startTime}:00`);
    if (!Number.isNaN(slotStart.getTime()) && slotStart.getTime() < Date.now()) {
      return;
    }

    setSelectedSlotIds((ids) =>
      ids.includes(slot.id) ? ids.filter((id) => id !== slot.id) : [...ids, slot.id]
    );
  };

  const selectedSlots = slots.filter((s) => selectedSlotIds.includes(s.id));
  const totalPrice = selectedSlots.reduce((s, sl) => s + sl.price, 0);
  const availabilitySummary = venue?.availabilitySummary ?? getAvailabilitySummary(slots, selectedDateStr);

  if (venueLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin" style={{ color: '#a04100' }} />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', color: '#241914' }}>
          Không tìm thấy địa điểm
        </p>
        <button
          onClick={() => navigate('/venues')}
          className="mt-4"
          style={{ color: '#a04100', fontFamily: 'Inter, sans-serif' }}
        >
          ← Quay lại danh sách sân
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff8f6' }}>
      <div className="relative w-full overflow-hidden" style={{ height: 280 }}>
        <ImageWithFallback src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(36,25,20,0.7) 100%)' }}
        />
        <button
          onClick={() => navigate('/venues')}
          className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <ArrowLeft size={16} />
          Sân đấu
        </button>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {venue.sports.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg capitalize"
                style={{
                  background: 'rgba(255,126,54,0.85)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {SPORT_EMOJI[s]} {s}
              </span>
            ))}
          </div>
          <h1
            style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '26px',
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {venue.name}
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.85)',
              marginTop: 2,
            }}
          >
            {venue.shortAddress}
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto w-full px-6 py-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <Star size={16} fill="#a04100" color="#a04100" />,
                label: `${venue.rating} (${venue.reviewCount} đánh giá)`,
              },
              {
                icon: <MapPin size={16} style={{ color: '#8b7266' }} />,
                label: venue.shortAddress,
              },
              { icon: <Clock size={16} style={{ color: '#8b7266' }} />, label: venue.openHours },
              {
                icon: <Users size={16} style={{ color: '#8b7266' }} />,
                label: `${venue.courtCount} sân`,
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-3 rounded-xl"
                style={{ background: '#fff', border: '1px solid #dfc0b3' }}
              >
                {stat.icon}
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#241914' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <h3
                  style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#241914',
                  }}
                >
                  Tóm tắt trạng thái
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 4 }}>
                  Trạng thái trực tuyến cho {selectedDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#a04100' }}>
                {availabilitySummary.totalSlots} tổng số khung giờ
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryChip label="Còn trống" value={availabilitySummary.availableSlots} tone="green" />
              <SummaryChip label="Tạm giữ" value={availabilitySummary.heldSlots} tone="brown" />
              <SummaryChip label="Đã đặt" value={availabilitySummary.bookedSlots} tone="orange" />
              <SummaryChip label="Không bán" value={availabilitySummary.unavailableSlots} tone="gray" />
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
            <h3
              style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                color: '#241914',
                marginBottom: 8,
              }}
            >
              Về địa điểm này
            </h3>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#584238',
                lineHeight: 1.6,
              }}
            >
              {venue.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {venue.facilities.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: '#fff1eb',
                    border: '1px solid rgba(160,65,0,0.15)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: '#a04100',
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle2 size={11} />
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#dfc0b3]">
              <h3
                style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#241914',
                }}
              >
                <CalendarDays size={16} style={{ display: 'inline', marginRight: 8, color: '#a04100' }} />
                Chọn Ngày & Khung Giờ
              </h3>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setWeekOffset((w) => w - 1);
                    setSelectedDateIdx(0);
                  }}
                  disabled={weekOffset <= 0}
                  className="p-1.5 rounded-lg hover:bg-[#fff1eb] disabled:opacity-30 transition-colors"
                  style={{ color: '#584238' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                  {dateTabs.map((d, i) => {
                    const isToday = weekOffset === 0 && i === 0;
                    const isSelected = i === selectedDateIdx;
                    const isPast = d < today && !isToday;
                    return (
                      <button
                        key={i}
                        onClick={() => !isPast && setSelectedDateIdx(i)}
                        disabled={isPast}
                        className="shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all"
                        style={{
                          background: isSelected ? '#a04100' : '#fff',
                          border: `1.5px solid ${isSelected ? '#a04100' : '#dfc0b3'}`,
                          opacity: isPast ? 0.4 : 1,
                          cursor: isPast ? 'not-allowed' : 'pointer',
                          minWidth: 72,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isSelected ? '#fff' : '#8b7266',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </span>
                        <span
                          style={{
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '16px',
                            fontWeight: 800,
                            color: isSelected ? '#fff' : '#241914',
                            lineHeight: 1.2,
                          }}
                        >
                          {d.getDate()}
                        </span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '10px',
                            color: isSelected ? 'rgba(255,255,255,0.8)' : '#8b7266',
                          }}
                        >
                          {d.toLocaleDateString('vi-VN', { month: 'short' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    setWeekOffset((w) => w + 1);
                    setSelectedDateIdx(0);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors"
                  style={{ color: '#584238' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {[
                  { color: '#fff', border: '#dfc0b3', label: 'Còn trống' },
                  { color: '#a04100', border: '#a04100', label: 'Đang chọn' },
                  { color: '#f8e3d8', border: '#dfc0b3', label: 'Tạm giữ' },
                  { color: '#f4ded5', border: '#e8c4b3', label: 'Đã đặt' },
                  { color: '#f7f0ed', border: '#e8c4b3', label: 'Không bán / Đóng cửa' },
                ].map(({ color, border, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded" style={{ background: color, border: `1.5px solid ${border}` }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <SlotGrid
                slots={slots}
                selectedIds={selectedSlotIds}
                onToggle={handleToggleSlot}
                loading={slotsLoading}
              />
            </div>
          </div>
        </div>

        <div className="lg:w-80 shrink-0">
          <div
            className="rounded-2xl overflow-hidden lg:sticky lg:top-20"
            style={{
              background: '#fff',
              border: '1px solid #dfc0b3',
              boxShadow: '0 4px 16px rgba(36,25,20,0.1)',
            }}
          >
            <div className="px-5 py-4 border-b border-[#dfc0b3]">
              <p
                style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#241914',
                }}
              >
                Tóm tắt đặt sân
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>Ngày</span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#241914',
                  }}
                >
                  {selectedDate.toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>Khung giờ đã chọn</span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#241914',
                  }}
                >
                  {selectedSlots.length === 0 ? 'Chưa chọn' : `${selectedSlots.length} khung giờ`}
                </span>
              </div>

              {selectedSlots.length > 0 && (
                <div className="flex flex-col gap-1.5 py-2 border-t border-[#dfc0b3]">
                  {selectedSlots.map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: '#584238',
                        }}
                      >
                        {s.startTime} – {s.endTime}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#241914',
                        }}
                      >
                        {formatPrice(s.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#dfc0b3] flex items-center justify-between">
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>Tổng cộng</span>
                <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                disabled={selectedSlots.length === 0}
                className="w-full h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(160,65,0,0.35)',
                }}
              >
                Tiếp tục thanh toán
              </button>

              {selectedSlots.length > 1 && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>
                  Hệ thống hiện chỉ hỗ trợ thanh toán một khung giờ tại một thời điểm. Vui lòng chọn một khung giờ duy nhất để tiếp tục.
                </p>
              )}

              {lastBooking && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#006a65' }}>
                  Lịch đặt gần nhất: #{lastBooking.id.slice(-8).toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          venue={venue}
          slots={selectedSlots}
          selectedDate={selectedDateStr}
          sport={venue.sports[0]}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(booking) => {
            setLastBooking(booking);
            setShowBookingModal(false);
            setSelectedSlotIds([]);
            fetchVenueSlots(venue.id, selectedDateStr).then((res) => {
              setSlots(res.slots);
              setVenue({
                ...venue,
                availabilitySummary: res.venue?.availabilitySummary ?? getAvailabilitySummary(res.slots, selectedDateStr),
              });
            });
          }}
          onGoToBookings={() => navigate('/bookings')}
        />
      )}
    </div>
  );
}
