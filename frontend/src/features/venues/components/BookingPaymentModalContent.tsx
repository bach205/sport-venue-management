import React from 'react';
import { X, Building2, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PaymentMethod, VenuePayment } from '../types/venues.types';

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
  return new Intl.NumberFormat(locale).format(n) + 'â‚«';
}

interface BookingPaymentModalContentProps {
  total: number;
  payment: VenuePayment | null;
  paymentMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onCheckPayment: () => void;
  onBack?: () => void;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function BookingPaymentModalContent({
  total,
  payment,
  paymentMethod,
  onMethodChange,
  onCheckPayment,
  onBack,
  loading,
  error,
  onClose,
}: BookingPaymentModalContentProps) {
  const { t, i18n } = useTranslation('matching');
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#dfc0b3] px-4 py-4 sm:px-6 sm:py-5">
        {onBack ? (
          <button onClick={onBack} className="rounded-lg px-2 py-1.5 transition-colors hover:bg-[#fff1eb]" style={{ color: '#584238' }}>
            {t('common:back')}
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            {t('venues.booking.payment')}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            {t('venues.booking.bankOnly')}
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
                  {paymentMethod === opt.id && enabled ? <CheckCircle2 size={18} style={{ color: '#a04100', marginLeft: 'auto' }} /> : null}
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
