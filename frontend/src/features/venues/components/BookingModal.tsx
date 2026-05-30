import React, { useState } from 'react';
import { X, Building2, CheckCircle2, ChevronRight, Lock, Loader2 } from 'lucide-react';

import type { Booking, PaymentMethod, Sport, Venue, VenuePayment, VenueSlot } from '../types/venues.types';
import {
  createBookingHold,
  createBookingPayment,
  fetchPaymentStatus,
} from '../api/venuesApi';
import { useTranslation } from 'react-i18next';

type Step = 'confirm' | 'payment' | 'success';

const PAYMENT_OPTIONS: { id: PaymentMethod; labelKey: string; icon: React.ReactNode; descKey: string }[] = [
  {
    id: 'bank',
    labelKey: 'venues.booking.paymentOptions.bank',
    icon: <Building2 size={18} />,
    descKey: 'venues.booking.paymentOptions.bankDescription',
  },
  {
    id: 'card',
    labelKey: 'venues.booking.paymentOptions.card',
    icon: <Lock size={18} />,
    descKey: 'venues.booking.paymentOptions.unavailable',
  },
  {
    id: 'momo',
    labelKey: 'venues.booking.paymentOptions.momo',
    icon: <Lock size={18} />,
    descKey: 'venues.booking.paymentOptions.unavailable',
  },
];

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
  const isSingleSlot = slots.length === 1;

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

        {!isSingleSlot && (
          <div className="rounded-xl px-4 py-3" style={{ background: '#fff3cd', border: '1px solid rgba(218,165,32,0.3)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#856404' }}>
              {t('venues.booking.singleSlotOnly')}
            </p>
          </div>
        )}

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
          disabled={!isSingleSlot || loading}
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

function PaymentStep({
  total,
  payment,
  paymentMethod,
  onMethodChange,
  onCheckPayment,
  onBack,
  loading,
  error,
}: {
  total: number;
  payment: VenuePayment | null;
  paymentMethod: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  onCheckPayment: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t, i18n } = useTranslation('matching');
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#dfc0b3] px-4 py-4 sm:px-6 sm:py-5">
        <button onClick={onBack} className="rounded-lg px-2 py-1.5 transition-colors hover:bg-[#fff1eb]" style={{ color: '#584238' }}>
          {t('common:back')}
        </button>
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            {t('venues.booking.payment')}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            {t('venues.booking.bankOnly')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full px-2 py-1" style={{ color: '#006a65', background: 'rgba(0,106,101,0.08)' }}>
          <Lock size={14} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#006a65' }}>SSL</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {error && (
          <div className="rounded-xl px-4 py-3" style={{ background: '#fff1eb', border: '1px solid rgba(160,65,0,0.15)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100' }}>{error}</p>
          </div>
        )}

        <div className="rounded-xl p-4" style={{ background: '#eefbf7', border: '1px solid rgba(0,106,101,0.12)' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>{t('venues.booking.paymentCreated')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>{t('venues.booking.paymentId')}: <strong>{payment?.id || 'N/A'}</strong></p>
            <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>{t('venues.booking.transferContent')}: <strong>{payment?.providerReference || payment?.id || 'N/A'}</strong></p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>{t('venues.booking.currentStatus')}: <strong>{payment?.status || 'pending'}</strong></p>
          </div>
        </div>

        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 8 }}>
            {t('venues.booking.paymentMethod')}
          </p>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const enabled = opt.id === 'bank';
              return (
                <button
                  key={opt.id}
                  onClick={() => enabled && onMethodChange(opt.id)}
                  disabled={!enabled}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: paymentMethod === opt.id ? '#a04100' : '#dfc0b3',
                    background: paymentMethod === opt.id ? '#fff1eb' : '#fff',
                    opacity: enabled ? 1 : 0.45,
                    cursor: enabled ? 'pointer' : 'not-allowed',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: paymentMethod === opt.id ? '#a04100' : '#f4ded5', color: paymentMethod === opt.id ? '#fff' : '#584238' }}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#241914' }}>{t(opt.labelKey)}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{t(opt.descKey)}</p>
                  </div>
                  {paymentMethod === opt.id && enabled && <CheckCircle2 size={18} style={{ color: '#a04100', marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#fff1eb', border: '1.5px solid #dfc0b3' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>{t('venues.booking.transferTo')}:</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,220px)_1fr]">
            {payment?.qrCodeUrl ? (
              <div className="mx-auto w-full max-w-[220px] rounded-2xl bg-white p-3" style={{ border: '1px solid rgba(223,192,179,0.7)' }}>
                <img
                  src={payment.qrCodeUrl}
                  alt="Sepay QR code"
                  className="aspect-square w-full rounded-xl object-contain"
                />
              </div>
            ) : null}
            <div className="grid gap-3 self-start">
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{t('venues.booking.bank')}</p>
                <p className="break-words" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 600 }}>{payment?.bankName || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{t('venues.booking.accountNumber')}</p>
                <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 600 }}>{payment?.bankAccountNumber || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{t('venues.booking.accountName')}</p>
                <p className="break-words" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 600 }}>{payment?.bankAccountName || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{t('venues.booking.transferContent')}</p>
                <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#a04100', fontWeight: 700 }}>{payment?.providerReference || payment?.id || 'N/A'}</p>
              </div>
            </div>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 12 }}>
            {t('venues.booking.transferHint')} <strong>{t('venues.booking.checkPayment')}</strong>.
          </p>
        </div>
      </div>

      <div className="border-t border-[#dfc0b3] px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>{t('venues.booking.amountDue')}</span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
            {formatPrice(total, locale)}
          </span>
        </div>
        <button
          onClick={onCheckPayment}
          disabled={loading}
          className="w-full h-13 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70"
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
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
          {loading ? t('venues.booking.checking') : t('venues.booking.checkPayment')}
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
    if (slots.length !== 1) {
      setError(t('venues.booking.errors.selectOneSlot'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedSlot = slots[0];
      const holdResult = await createBookingHold({
        venue_id: venue.id,
        date: selectedDate,
        start_time: selectedSlot.startTime,
        end_time: selectedSlot.endTime,
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
          <PaymentStep
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
