import React, { useState } from 'react';
import { X, CreditCard, Wallet, Building2, CheckCircle2, ChevronRight, Lock, Loader2 } from 'lucide-react';
import type { Venue, VenueSlot, PaymentMethod, BookedSlotRef, Sport } from '../types/venues.types';
import { createBooking } from '../store/bookingStore';
import type { Booking } from '../types/venues.types';

type Step = 'confirm' | 'payment' | 'success';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: <CreditCard size={18} />,
    desc: 'Visa, Mastercard, JCB',
  },
  {
    id: 'momo',
    label: 'MoMo Wallet',
    icon: <Wallet size={18} />,
    desc: 'Pay via MoMo e-wallet',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: <Building2 size={18} />,
    desc: 'Vietcombank, Techcombank...',
  },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Step 1: Confirm ─────────────────────────────────────────────────────────
function ConfirmStep({
  venue,
  slots,
  selectedDate,
  sport,
  notes,
  onNotesChange,
  onNext,
  onClose,
}: {
  venue: Venue;
  slots: VenueSlot[];
  selectedDate: string;
  sport: Sport;
  notes: string;
  onNotesChange: (v: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const total = slots.reduce((s, sl) => s + sl.price, 0);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#dfc0b3]">
        <div>
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            Confirm Booking
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            Review your selected slots
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors" style={{ color: '#584238' }}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {/* Venue summary */}
        <div className="rounded-xl p-4 flex gap-4" style={{ background: '#fff1eb', border: '1px solid rgba(223,192,179,0.4)' }}>
          <img
            src={venue.imageUrl}
            alt={venue.name}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '15px', fontWeight: 700, color: '#241914' }}>
              {venue.name}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238', marginTop: 2 }}>
              {venue.shortAddress}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100', fontWeight: 600, marginTop: 4 }}>
              📅 {formatDate(selectedDate)}
            </p>
          </div>
        </div>

        {/* Selected slots */}
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 8 }}>
            Selected Slots ({slots.length})
          </p>
          <div className="flex flex-col gap-2">
            {slots.map(slot => (
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
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
                <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#a04100' }}>
                  {formatPrice(slot.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="e.g. Need equipment rental, 4 players"
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
            onFocus={e => { e.target.style.borderColor = '#006a65'; }}
            onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-4 border-t border-[#dfc0b3]">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>Total</span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
            {formatPrice(total)}
          </span>
        </div>
        <button
          onClick={onNext}
          className="w-full h-13 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
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
          Continue to Payment
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Payment ─────────────────────────────────────────────────────────
function PaymentStep({
  total,
  paymentMethod,
  onMethodChange,
  onPay,
  onBack,
  loading,
}: {
  total: number;
  paymentMethod: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  onPay: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #dfc0b3',
    borderRadius: 10,
    padding: '10px 14px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#241914',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#dfc0b3]">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors" style={{ color: '#584238' }}>
          ← 
        </button>
        <div>
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            Payment
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            Secure checkout
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1" style={{ color: '#006a65' }}>
          <Lock size={14} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#006a65' }}>SSL</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Payment method */}
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 8 }}>
            Payment Method
          </p>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => onMethodChange(opt.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: paymentMethod === opt.id ? '#a04100' : '#dfc0b3',
                  background: paymentMethod === opt.id ? '#fff1eb' : '#fff',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: paymentMethod === opt.id ? '#a04100' : '#f4ded5', color: paymentMethod === opt.id ? '#fff' : '#584238' }}
                >
                  {opt.icon}
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#241914' }}>{opt.label}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{opt.desc}</p>
                </div>
                {paymentMethod === opt.id && (
                  <CheckCircle2 size={18} style={{ color: '#a04100', marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card fields (only when card selected) */}
        {paymentMethod === 'card' && (
          <div className="flex flex-col gap-3">
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 2 }}>
              Card Details
            </p>
            <input
              style={inputStyle}
              placeholder="Cardholder Name"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#006a65'; }}
              onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            />
            <input
              style={inputStyle}
              placeholder="Card Number"
              value={cardNumber}
              onChange={e => setCardNumber(formatCard(e.target.value))}
              maxLength={19}
              onFocus={e => { e.target.style.borderColor = '#006a65'; }}
              onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            />
            <div className="flex gap-3">
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="MM/YY"
                value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                onFocus={e => { e.target.style.borderColor = '#006a65'; }}
                onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="CVV"
                type="password"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                maxLength={3}
                onFocus={e => { e.target.style.borderColor = '#006a65'; }}
                onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
              />
            </div>
          </div>
        )}

        {paymentMethod === 'momo' && (
          <div
            className="flex flex-col items-center gap-3 py-6 rounded-xl"
            style={{ background: '#fff1eb', border: '1.5px solid #dfc0b3' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ background: '#fff' }}>
              💜
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>
              You'll be redirected to MoMo after confirming
            </p>
          </div>
        )}

        {paymentMethod === 'bank' && (
          <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: '#fff1eb', border: '1.5px solid #dfc0b3' }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>Transfer to:</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>Bank: <strong>Vietcombank</strong></p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>Account: <strong>1234 5678 9012</strong></p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>Name: <strong>Matchill Sports JSC</strong></p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 4 }}>
              ⚠️ Booking will be confirmed after transfer is verified (up to 15 min).
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-4 border-t border-[#dfc0b3]">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>Total to pay</span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
            {formatPrice(total)}
          </span>
        </div>
        <button
          onClick={onPay}
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
          {loading ? 'Processing…' : `Pay ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Success ─────────────────────────────────────────────────────────
function SuccessStep({
  booking,
  onGoToBookings,
  onClose,
}: {
  booking: Booking;
  onGoToBookings: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-8 text-center gap-5">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#006a65,#00b09e)', boxShadow: '0 8px 24px rgba(0,106,101,0.35)' }}
      >
        <CheckCircle2 size={48} color="#fff" strokeWidth={2.5} />
      </div>

      <div>
        <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '26px', fontWeight: 800, color: '#241914' }}>
          Booking Confirmed!
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 6 }}>
          Your slot has been reserved successfully
        </p>
      </div>

      <div className="w-full rounded-xl p-4 text-left flex flex-col gap-2" style={{ background: '#fff1eb', border: '1px solid rgba(223,192,179,0.4)' }}>
        <Row label="Venue" value={booking.venueName} />
        <Row label="Date" value={formatDate(booking.date)} />
        <Row
          label="Slots"
          value={booking.slots.map(s => `${s.startTime}–${s.endTime}`).join(', ')}
        />
        <Row label="Booking ID" value={`#${booking.id.slice(-8).toUpperCase()}`} />
        <Row label="Amount Paid" value={formatPrice(booking.totalPrice)} highlight />
      </div>

      <div
        className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: '#e7f8f7', border: '1px solid rgba(0,106,101,0.2)' }}
      >
        <span style={{ fontSize: 20 }}>💡</span>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#006a65' }}>
          You can request a <strong>full refund within 5 minutes</strong> from Booking History.
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
          View My Bookings
        </button>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl hover:bg-[#fff1eb] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
        >
          Continue Browsing
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

// ─── Main BookingModal ────────────────────────────────────────────────────────
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
  const [step, setStep] = useState<Step>('confirm');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const total = slots.reduce((s, sl) => s + sl.price, 0);

  const handlePay = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1800));

    const slotRefs: BookedSlotRef[] = slots.map(s => ({
      slotId: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      price: s.price,
    }));

    const b = createBooking({
      venueId: venue.id,
      venueName: venue.name,
      venueImage: venue.imageUrl,
      venueAddress: venue.fullAddress,
      sport,
      date: selectedDate,
      slots: slotRefs,
      paymentMethod,
      notes,
      playerName: 'You',
    });

    setBooking(b);
    setLoading(false);
    setStep('success');
    onSuccess(b);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(36,25,20,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget && step !== 'payment') onClose(); }}
    >
      <div
        className="relative bg-white rounded-2xl w-full flex flex-col"
        style={{
          maxWidth: 480,
          maxHeight: '92vh',
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
            onNext={() => setStep('payment')}
            onClose={onClose}
          />
        )}
        {step === 'payment' && (
          <PaymentStep
            total={total}
            paymentMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            onPay={handlePay}
            onBack={() => setStep('confirm')}
            loading={loading}
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
