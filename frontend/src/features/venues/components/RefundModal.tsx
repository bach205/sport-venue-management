import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, Loader2, RotateCcw, Phone } from 'lucide-react';
import type { Booking } from '../types/venues.types';
import { requestBookingRefund } from '../api/venuesApi';
import { useTranslation } from 'react-i18next';

const REFUND_WINDOW_MS = 5 * 60 * 1000;

function formatPrice(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n) + '₫';
}

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getRefundWindowRemaining(booking: Booking): number {
  if (!booking.paidAt) return 0;
  const elapsed = Date.now() - new Date(booking.paidAt).getTime();
  return Math.max(0, REFUND_WINDOW_MS - elapsed);
}

function formatSlotRange(booking: Booking) {
  return booking.slots.map((slot) => `${slot.startTime}-${slot.endTime}`).join(', ');
}

interface Props {
  booking: Booking;
  onClose: () => void;
  onRefunded: (updated: Booking) => void | Promise<void>;
}

export function RefundModal({ booking, onClose, onRefunded }: Props) {
  const { t, i18n } = useTranslation('matching');
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  const [remaining, setRemaining] = useState(() => getRefundWindowRemaining(booking));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [updatedBooking, setUpdatedBooking] = useState<Booking | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      const r = getRefundWindowRemaining(booking);
      setRemaining(r);
      if (r <= 0) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [booking, remaining]);

  const windowExpired = remaining <= 0;
  const progressPct = Math.min(100, ((REFUND_WINDOW_MS - remaining) / REFUND_WINDOW_MS) * 100);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestBookingRefund(booking.id, {});
      setUpdatedBooking(result.booking);
      setMode(result.mode);
      setDone(true);
      await onRefunded(result.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('venues.refund.errors.request'));
    } finally {
      setLoading(false);
    }
  };

  const displayBooking = updatedBooking ?? booking;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(36,25,20,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="relative bg-white rounded-2xl w-full"
        style={{
          maxWidth: 440,
          boxShadow: '0 24px 64px rgba(36,25,20,0.3)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#dfc0b3]">
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            {done ? t('venues.refund.requested') : windowExpired ? t('venues.refund.unavailable') : t('venues.refund.request')}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors"
            style={{ color: '#584238' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">
          {error && (
            <div className="rounded-xl px-4 py-3" style={{ background: '#fff1eb', border: '1px solid rgba(160,65,0,0.15)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100' }}>{error}</p>
            </div>
          )}

          {done && (
            <>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#e7f8f7' }}>
                  <CheckCircle2 size={36} style={{ color: '#006a65' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '20px', fontWeight: 700, color: '#241914' }}>
                    {mode === 'auto' ? t('venues.refund.success') : t('venues.refund.sent')}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 6 }}>
                    {mode === 'auto'
                      ? t('venues.refund.autoSuccess', { price: formatPrice(displayBooking.totalPrice, locale) })
                      : t('venues.refund.manualSent', { price: formatPrice(displayBooking.totalPrice, locale) })}
                  </p>
                </div>
                <div className="w-full rounded-xl px-4 py-3" style={{ background: '#e7f8f7', border: '1px solid rgba(0,106,101,0.2)' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#006a65' }}>
                    {t('venues.refund.systemStatus')}: <strong>{t(`venues.bookingStatuses.${displayBooking.status}`, displayBooking.status)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full h-12 rounded-xl transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#fff',
                  border: 'none',
                }}
              >
                {t('venues.refund.done')}
              </button>
            </>
          )}

          {!done && windowExpired && (
            <>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fff1eb' }}>
                  <AlertTriangle size={36} style={{ color: '#a04100' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
                    {t('venues.refund.windowExpired')}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 6 }}>
                    {t('venues.refund.manualApproval')}
                  </p>
                </div>
                <div className="w-full rounded-xl p-4 flex items-start gap-3" style={{ background: '#fff1eb', border: '1.5px solid #dfc0b3' }}>
                  <Phone size={18} style={{ color: '#a04100', marginTop: 2, flexShrink: 0 }} />
                  <div className="text-left">
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>
                      {booking.venueName}
                    </p>
                    {booking.venuePhone && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100', marginTop: 4 }}>
                        {t('venues.fields.phone')}: <strong>{booking.venuePhone}</strong>
                      </p>
                    )}
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238', marginTop: 2 }}>
                      {t('venues.refund.contactIfRejected')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl hover:bg-[#fff1eb] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
                >
                  {t('venues.refund.close')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{
                    background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  {loading ? t('venues.refund.sending') : t('venues.refund.send')}
                </button>
              </div>
            </>
          )}

          {!done && !windowExpired && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
                    {t('venues.refund.windowClosesIn')}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: remaining < 60_000 ? '#ba1a1a' : '#006a65',
                    }}
                  >
                    {formatCountdown(remaining)}
                  </span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: '#f4ded5' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${100 - progressPct}%`,
                      background: remaining < 60_000
                        ? 'linear-gradient(90deg,#ba1a1a,#ff5555)'
                        : 'linear-gradient(90deg,#006a65,#00b09e)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: '#fff1eb', border: '1px solid rgba(223,192,179,0.4)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 4 }}>
                  {t('venues.refund.bookingInfo')}
                </p>
                <Row label={t('venues.fields.venue')} value={booking.venueName} />
                <Row label={t('venues.fields.date')} value={new Date(booking.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} />
                {booking.venuePhone ? <Row label={t('venues.fields.phone')} value={booking.venuePhone} /> : null}
                <Row label={t('venues.fields.slots')} value={formatSlotRange(booking)} />
                <Row label={t('venues.refund.amount')} value={formatPrice(booking.totalPrice, locale)} highlight />
              </div>

              <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: '#fff3cd', border: '1px solid rgba(218,165,32,0.3)' }}>
                <AlertTriangle size={16} style={{ color: '#996600', marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#664400' }}>
                  {t('venues.refund.methodNotice')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl hover:bg-[#fff1eb] transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{
                    background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  {loading ? t('common:processing') : t('venues.refund.confirm')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266' }}>{label}</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: highlight ? 700 : 500, color: highlight ? '#a04100' : '#241914' }}>
        {value}
      </span>
    </div>
  );
}
