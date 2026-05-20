import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CalendarDays, MapPin, Clock, RotateCcw, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchMyBookings } from '../api/venuesApi';
import { RefundModal } from '../components/RefundModal';
import type { Booking, BookingStatus } from '../types/venues.types';

const REFUND_WINDOW_MS = 5 * 60 * 1000;

type Tab = 'all' | 'confirmed' | 'payment_pending' | 'refund_processing' | 'refunded' | 'expired';

const STATUS_LABEL: Record<BookingStatus, string> = {
  hold: 'On Hold',
  payment_pending: 'Payment Pending',
  confirmed: 'Confirmed',
  refund_processing: 'Refund Processing',
  refunded: 'Refunded',
  refund_rejected: 'Refund Rejected',
  expired: 'Expired',
};

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string }> = {
  hold: { bg: '#fff3cd', color: '#856404' },
  payment_pending: { bg: '#fff3cd', color: '#856404' },
  confirmed: { bg: '#e7f8f7', color: '#006a65' },
  refund_processing: { bg: '#fff3cd', color: '#856404' },
  refunded: { bg: '#f4ded5', color: '#8b7266' },
  refund_rejected: { bg: '#fff1eb', color: '#a04100' },
  expired: { bg: '#f7f0ed', color: '#8b7266' },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCountdown(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function getRefundWindowRemaining(booking: Booking): number {
  if (!booking.paidAt) return 0;
  const elapsed = Date.now() - new Date(booking.paidAt).getTime();
  return Math.max(0, REFUND_WINDOW_MS - elapsed);
}

const SPORT_EMOJI: Record<string, string> = {
  tennis: '🎾', basketball: '🏀', badminton: '🏸',
  football: '⚽', pickleball: '🏓', volleyball: '🏐',
};

function RefundCountdown({ booking }: { booking: Booking }) {
  const [remaining, setRemaining] = useState(() => getRefundWindowRemaining(booking));

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      const r = getRefundWindowRemaining(booking);
      setRemaining(r);
      if (r <= 0) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [booking, remaining]);

  if (remaining <= 0) return null;

  const progress = Math.max(0, (REFUND_WINDOW_MS - remaining) / REFUND_WINDOW_MS);
  const isUrgent = remaining < 60_000;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{ background: isUrgent ? '#fff3cd' : '#e7f8f7', border: `1px solid ${isUrgent ? 'rgba(218,165,32,0.3)' : 'rgba(0,106,101,0.2)'}` }}
    >
      <Clock size={14} style={{ color: isUrgent ? '#856404' : '#006a65', flexShrink: 0 }} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: isUrgent ? '#856404' : '#006a65', fontWeight: 500 }}>
            Auto-refund window
          </span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '13px', fontWeight: 700, color: isUrgent ? '#856404' : '#006a65' }}>
            {formatCountdown(remaining)}
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(0,0,0,0.1)' }}>
          <div
            style={{
              height: '100%',
              width: `${(1 - progress) * 100}%`,
              borderRadius: '9999px',
              background: isUrgent ? '#dc3545' : '#006a65',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onRefund }: { booking: Booking; onRefund: (b: Booking) => void }) {
  const remaining = getRefundWindowRemaining(booking);
  const canRefund = booking.status === 'confirmed';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #dfc0b3', boxShadow: '0 2px 8px rgba(36,25,20,0.07)' }}
    >
      <div className="flex gap-4 p-5 border-b border-[#dfc0b3]">
        <img src={booking.venueImage} alt={booking.venueName} className="w-20 h-20 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate" style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700, color: '#241914' }}>
              {booking.venueName}
            </h3>
            <span
              className="shrink-0 px-2.5 py-1 rounded-full"
              style={{
                background: STATUS_STYLE[booking.status].bg,
                color: STATUS_STYLE[booking.status].color,
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin size={12} style={{ color: '#8b7266' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>{booking.venueAddress}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span style={{ fontSize: 13 }}>{SPORT_EMOJI[booking.sport]}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238', textTransform: 'capitalize' }}>
              {booking.sport}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginBottom: 2 }}>DATE</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>
              {formatDate(booking.date)}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginBottom: 2 }}>SLOTS</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>
              {booking.slots.map(s => s.startTime).join(', ')}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginBottom: 2 }}>BOOKING ID</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>
              #{booking.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginBottom: 2 }}>TOTAL PAID</p>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 800, color: '#a04100' }}>
              {formatPrice(booking.totalPrice)}
            </p>
          </div>
        </div>

        {booking.status === 'confirmed' && remaining > 0 && <RefundCountdown booking={booking} />}

        {booking.status === 'payment_pending' && booking.holdExpiresAt && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#fff3cd', border: '1px solid rgba(218,165,32,0.3)' }}>
            <Loader2 size={14} className="animate-spin" style={{ color: '#856404', flexShrink: 0 }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#856404' }}>
              Waiting for payment confirmation. Hold expires at {new Date(booking.holdExpiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          </div>
        )}

        {booking.status === 'refund_processing' && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#fff3cd', border: '1px solid rgba(218,165,32,0.3)' }}>
            <Loader2 size={14} className="animate-spin" style={{ color: '#856404', flexShrink: 0 }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#856404' }}>
              Refund request submitted and being processed by the server.
            </p>
          </div>
        )}

        {booking.status === 'refunded' && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#e7f8f7', border: '1px solid rgba(0,106,101,0.2)' }}>
            <CheckCircle2 size={14} style={{ color: '#006a65', flexShrink: 0 }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#006a65' }}>
              <strong>{formatPrice(booking.totalPrice)}</strong> refunded to your account.
            </p>
          </div>
        )}

        {booking.status === 'refund_rejected' && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#fff1eb', border: '1px solid rgba(160,65,0,0.15)' }}>
            <Phone size={14} style={{ color: '#a04100', flexShrink: 0 }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100' }}>
              Refund request was rejected. Contact the venue for more details.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {canRefund && (
            <button
              onClick={() => onRefund(booking)}
              className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                border: 'none',
              }}
            >
              <RotateCcw size={14} />
              Request Refund
            </button>
          )}
          {(booking.status === 'expired' || booking.status === 'refund_rejected') && (
            <button
              onClick={() => onRefund(booking)}
              className="flex items-center gap-2 px-3 h-10 rounded-xl hover:bg-[#fff1eb] transition-colors"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#584238',
                border: '1.5px solid #dfc0b3',
              }}
            >
              <Phone size={14} />
              Contact Venue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyBookings({ page: 1, limit: 50 });
      setBookings(res.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const t = setInterval(() => setBookings((current) => [...current]), 10_000);
    return () => clearInterval(t);
  }, []);

  const filtered = bookings.filter(b => tab === 'all' || b.status === tab);

  const handleRefunded = useCallback(async () => {
    await loadBookings();
  }, [loadBookings]);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: `All (${bookings.length})` },
    { id: 'confirmed', label: `Confirmed (${bookings.filter(b => b.status === 'confirmed').length})` },
    { id: 'payment_pending', label: `Pending (${bookings.filter(b => b.status === 'payment_pending').length})` },
    { id: 'refund_processing', label: `Refunding (${bookings.filter(b => b.status === 'refund_processing').length})` },
    { id: 'refunded', label: `Refunded (${bookings.filter(b => b.status === 'refunded').length})` },
    { id: 'expired', label: `Expired (${bookings.filter(b => b.status === 'expired').length})` },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff8f6' }}>
      <div className="border-b border-[#dfc0b3] bg-[#fff8f6]">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/venues')}
              className="p-2 rounded-lg hover:bg-[#fff1eb] transition-colors"
              style={{ color: '#584238' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 700, color: '#241914' }}>
                My Bookings
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 2 }}>
                Manage your court reservations and refunds
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 mt-4">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="shrink-0 px-4 py-2 rounded-xl transition-all"
                style={{
                  background: tab === t.id ? '#a04100' : '#fff',
                  border: `1.5px solid ${tab === t.id ? '#a04100' : '#dfc0b3'}`,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: tab === t.id ? 700 : 400,
                  color: tab === t.id ? '#fff' : '#584238',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: '#a04100' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CalendarDays size={56} style={{ color: '#dfc0b3', marginBottom: 16 }} />
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 600, color: '#241914' }}>
              No bookings yet
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266', marginTop: 8, maxWidth: 280 }}>
              Book a court on the Venues page to get started
            </p>
            <button
              onClick={() => navigate('/venues')}
              className="mt-6 h-11 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                border: 'none',
              }}
            >
              Browse Venues
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map(b => (
              <BookingCard key={b.id} booking={b} onRefund={setRefundTarget} />
            ))}
          </div>
        )}
      </div>

      {refundTarget && (
        <RefundModal
          booking={refundTarget}
          onClose={() => setRefundTarget(null)}
          onRefunded={async () => {
            await handleRefunded();
            setRefundTarget(null);
          }}
        />
      )}
    </div>
  );
}
