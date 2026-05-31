import React, { useState } from 'react';
import { X, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

import type { Booking, PaymentMethod, Sport, Venue, VenuePayment, VenueSlot } from '../types/venues.types';
import {
  createBookingHold,
  createBookingPayment,
  fetchPaymentStatus,
} from '../api/venuesApi';
import { useTranslation } from 'react-i18next';
import { BookingPaymentModalContent } from './BookingPaymentModalContent';

type Step = 'confirm' | 'payment' | 'success';

function formatPrice(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n) + '₫';
}

function formatDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function ConfirmStep({
  venue,
  slots,
  selectedDate,
  sport,
  notes,
  onNotesChange,
  onNext,
  onClose,
  loading,
  error,
}: {
  venue: Venue;
  slots: VenueSlot[];
  selectedDate: string;
  sport: Sport;
  notes: string;
  onNotesChange: (v: string) => void;
  onNext: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t, i18n } = useTranslation('matching');
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  const total = slots.reduce((s, sl) => s + sl.price, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[#dfc0b3] px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            {t('venues.booking.confirmTitle')}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            {t('venues.booking.confirmSubtitle')}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors" style={{ color: '#584238' }}>
          <X size={20} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {error && (
          <div className="rounded-xl px-4 py-3" style={{ background: '#fff1eb', border: '1px solid rgba(160,65,0,0.15)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100' }}>{error}</p>
          </div>
        )}

        <div className="rounded-xl p-4 flex gap-4" style={{ background: '#fff1eb', border: '1px solid rgba(223,192,179,0.4)' }}>
          <img src={venue.imageUrl} alt={venue.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
          <div>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '15px', fontWeight: 700, color: '#241914' }}>
              {venue.name}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238', marginTop: 2 }}>
              {venue.shortAddress}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100', fontWeight: 600, marginTop: 4 }}>
              {t('venues.fields.date')}: {formatDate(selectedDate, locale)}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 4, textTransform: 'capitalize' }}>
              {t(`sports.${sport}`, sport)}
            </p>
          </div>
        </div>

        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 8 }}>
            {t('venues.booking.selectedSlots', { count: slots.length })}
          </p>
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: '#fff', border: '1.5px solid #dfc0b3' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)' }}
                  >
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                      {slot.startTime.split(':')[0]}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 500 }}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#a04100' }}>
                  {formatPrice(slot.price, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            {t('venues.booking.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={t('venues.booking.notesPlaceholder')}
            rows={3}
            style={{
              width: '100%',
              border: '1.5px solid #dfc0b3',
              borderRadius: 10,
              padding: '10px 14px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#241914',
              background: '#fff',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div className="border-t border-[#dfc0b3] px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>{t('venues.fields.total')}</span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
            {formatPrice(total, locale)}
          </span>
        </div>
        <button
          onClick={onNext}
          disabled={slots.length === 0 || loading}
          className="w-full h-13 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(90deg,#a04100,#ff7e36)',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            color: '#fff',
            border: 'none',
            padding: '14px 24px',
            boxShadow: '0 4px 14px rgba(160,65,0,0.35)',
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
          {loading ? t('venues.booking.creating') : t('venues.detail.continuePayment')}
        </button>
      </div>
    </div>
  );
}

function SuccessStep({
  booking,
  onGoToBookings,
  onClose,
}: {
  booking: Booking;
  onGoToBookings: () => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation('matching');
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  return (
    <div className="flex flex-col items-center gap-5 px-5 py-6 text-center sm:px-8 sm:py-8">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#006a65,#00b09e)', boxShadow: '0 8px 24px rgba(0,106,101,0.35)' }}
      >
        <CheckCircle2 size={48} color="#fff" strokeWidth={2.5} />
      </div>

      <div>
        <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '26px', fontWeight: 800, color: '#241914' }}>
          {t('venues.booking.successTitle')}
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 6 }}>
          {t('venues.booking.successSubtitle')}
        </p>
      </div>

      <div className="w-full rounded-xl p-4 text-left flex flex-col gap-2" style={{ background: '#fff1eb', border: '1px solid rgba(223,192,179,0.4)' }}>
        <Row label={t('venues.fields.venue')} value={booking.venueName} />
        <Row label={t('venues.fields.date')} value={formatDate(booking.date, locale)} />
        <Row label={t('venues.fields.slots')} value={booking.slots.map((s) => `${s.startTime}-${s.endTime}`).join(', ')} />
        <Row label={t('venues.fields.bookingId')} value={`#${booking.id.slice(-8).toUpperCase()}`} />
        <Row label={t('venues.fields.paid')} value={formatPrice(booking.totalPrice, locale)} highlight />
      </div>

      <div className="w-full rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#e7f8f7', border: '1px solid rgba(0,106,101,0.2)' }}>
        <span style={{ fontSize: 20 }}>{t('venues.booking.tip')}</span>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#006a65' }}>
          {t('venues.booking.refundTip')}
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={onGoToBookings}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
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
          {t('venues.page.myBookings')}
        </button>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl hover:bg-[#fff1eb] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
        >
          {t('venues.booking.continueBrowsing')}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266' }}>{label}</span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: highlight ? 700 : 500,
          color: highlight ? '#a04100' : '#241914',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface Props {
  venue: Venue;
  slots: VenueSlot[];
  selectedDate: string;
  sport: Sport;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  onGoToBookings: () => void;
}

export function BookingModal({ venue, slots, selectedDate, sport, onClose, onSuccess, onGoToBookings }: Props) {
  const { t } = useTranslation('matching');
  const [step, setStep] = useState<Step>('confirm');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<VenuePayment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = slots.reduce((s, sl) => s + sl.price, 0);

  const handleContinueToPayment = async () => {
    if (slots.length === 0) {
      setError(t('venues.booking.errors.selectAtLeastOneSlot'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const firstSlot = sortedSlots[0];
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const holdResult = await createBookingHold({
        venue_id: venue.id,
        date: selectedDate,
        start_time: firstSlot.startTime,
        end_time: lastSlot.endTime,
      });

      const paymentResult = holdResult.payment?.provider === 'sepay'
        ? holdResult
        : await createBookingPayment(holdResult.booking.id, {
          provider: 'sepay',
          return_url: window.location.href,
        });

      if (!paymentResult.payment) {
        throw new Error('Payment record was not returned by the server.');
      }

      setBooking(paymentResult.booking);
      setPayment(paymentResult.payment);
      setPaymentMethod('bank');
      setStep('payment');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('venues.booking.errors.createPayment');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!payment?.id) {
      setError(t('venues.booking.errors.notInitialized'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statusResult = await fetchPaymentStatus(payment.id);
      setBooking(statusResult.booking);
      setPayment(statusResult.payment);

      if (statusResult.payment?.status === 'paid' && statusResult.booking.status === 'confirmed') {
        setStep('success');
        onSuccess(statusResult.booking);
        return;
      }

      if (statusResult.payment?.status === 'failed' || statusResult.booking.status === 'expired') {
        setError(t('venues.booking.errors.expired'));
        return;
      }

      setError(t('venues.booking.errors.processing'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('venues.booking.errors.checkPayment');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4"
      style={{ background: 'rgba(36,25,20,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'payment') onClose(); }}
    >
      <div
        className="relative flex h-[min(100dvh-1rem,46rem)] w-full max-w-[38rem] flex-col overflow-hidden rounded-[24px] bg-white sm:h-auto sm:max-h-[92vh]"
        style={{
          boxShadow: '0 24px 64px rgba(36,25,20,0.3)',
        }}
      >
        {step === 'confirm' && (
          <ConfirmStep
            venue={venue}
            slots={slots}
            selectedDate={selectedDate}
            sport={sport}
            notes={notes}
            onNotesChange={setNotes}
            onNext={handleContinueToPayment}
            onClose={onClose}
            loading={loading}
            error={error}
          />
        )}
        {step === 'payment' && (
          <BookingPaymentModalContent
            total={total}
            payment={payment}
            paymentMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            onCheckPayment={handleCheckPayment}
            onBack={() => {
              setError(null);
              setStep('confirm');
            }}
            loading={loading}
            error={error}
            onClose={onClose}
          />
        )}
        {step === 'success' && booking && (
          <SuccessStep
            booking={booking}
            onGoToBookings={onGoToBookings}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
