import React, { useState } from 'react';
import { X, Building2, CheckCircle2, ChevronRight, Lock, Loader2 } from 'lucide-react';

import type { Booking, PaymentMethod, Sport, Venue, VenuePayment, VenueSlot } from '../types/venues.types';
import {
  createBookingHold,
  createBookingPayment,
  fetchPaymentStatus,
} from '../api/venuesApi';

type Step = 'confirm' | 'payment' | 'success';

const SPORT_LABELS: Record<string, string> = {
  tennis: 'Tennis',
  basketball: 'Bóng rổ',
  badminton: 'Cầu lông',
  football: 'Bóng đá',
  pickleball: 'Pickleball',
  volleyball: 'Bóng chuyền',
};

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'bank',
    label: 'Chuyển khoản ngân hàng',
    icon: <Building2 size={18} />,
    desc: 'Vietcombank, Techcombank...',
  },
  {
    id: 'card',
    label: 'Thẻ tín dụng / Ghi nợ',
    icon: <Lock size={18} />,
    desc: 'Tạm thời không khả dụng cho luồng này',
  },
  {
    id: 'momo',
    label: 'Ví MoMo',
    icon: <Lock size={18} />,
    desc: 'Tạm thời không khả dụng cho luồng này',
  },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
  const total = slots.reduce((s, sl) => s + sl.price, 0);
  const isSingleSlot = slots.length === 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[#dfc0b3] px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            Xác nhận đặt sân
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            Kiểm tra lại khung giờ đã chọn
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
              Ngày: {formatDate(selectedDate)}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 4, textTransform: 'capitalize' }}>
              {SPORT_LABELS[sport] || sport}
            </p>
          </div>
        </div>

        {!isSingleSlot && (
          <div className="rounded-xl px-4 py-3" style={{ background: '#fff3cd', border: '1px solid rgba(218,165,32,0.3)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#856404' }}>
              Hệ thống hiện chỉ hỗ trợ đặt một khung giờ tại một thời điểm. Vui lòng quay lại và chọn một khung giờ duy nhất.
            </p>
          </div>
        )}

        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 8 }}>
            Khung giờ đã chọn ({slots.length})
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
                  {formatPrice(slot.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            Ghi chú (tùy chọn)
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ví dụ: Cần thuê vợt, 4 người chơi"
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
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>Tổng cộng</span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
            {formatPrice(total)}
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
          {loading ? 'Đang tạo lịch đặt...' : 'Tiếp tục thanh toán'}
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
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#dfc0b3] px-4 py-4 sm:px-6 sm:py-5">
        <button onClick={onBack} className="rounded-lg px-2 py-1.5 transition-colors hover:bg-[#fff1eb]" style={{ color: '#584238' }}>
          Back
        </button>
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914' }}>
            Payment
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginTop: 2 }}>
            Chỉ hỗ trợ chuyển khoản
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
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>Đã tạo yêu cầu thanh toán</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>Mã thanh toán: <strong>{payment?.id || 'N/A'}</strong></p>
            <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>Nội dung chuyển khoản: <strong>{payment?.providerReference || payment?.id || 'N/A'}</strong></p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>Trạng thái hiện tại: <strong>{payment?.status || 'pending'}</strong></p>
          </div>
        </div>

        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', marginBottom: 8 }}>
            Phương thức thanh toán
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
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#241914' }}>{opt.label}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{opt.desc}</p>
                  </div>
                  {paymentMethod === opt.id && enabled && <CheckCircle2 size={18} style={{ color: '#a04100', marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#fff1eb', border: '1.5px solid #dfc0b3' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914' }}>Chuyển khoản tới:</p>
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
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>Ngân hàng</p>
                <p className="break-words" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 600 }}>{payment?.bankName || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>Số tài khoản</p>
                <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 600 }}>{payment?.bankAccountNumber || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>Tên tài khoản</p>
                <p className="break-words" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', fontWeight: 600 }}>{payment?.bankAccountName || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2" style={{ border: '1px solid rgba(223,192,179,0.65)' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>Nội dung chuyển khoản</p>
                <p className="break-all" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#a04100', fontWeight: 700 }}>{payment?.providerReference || payment?.id || 'N/A'}</p>
              </div>
            </div>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 12 }}>
            Quét mã QR hoặc chuyển khoản thủ công với nội dung chính xác như trên, sau đó nhấn <strong>Kiểm tra thanh toán</strong>.
          </p>
        </div>
      </div>

      <div className="border-t border-[#dfc0b3] px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238' }}>Tổng số tiền cần trả</span>
          <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100' }}>
            {formatPrice(total)}
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
          {loading ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
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
          Đã đặt sân thành công!
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 6 }}>
          Khung giờ của bạn đã được giữ chỗ thành công
        </p>
      </div>

      <div className="w-full rounded-xl p-4 text-left flex flex-col gap-2" style={{ background: '#fff1eb', border: '1px solid rgba(223,192,179,0.4)' }}>
        <Row label="Địa điểm" value={booking.venueName} />
        <Row label="Ngày" value={formatDate(booking.date)} />
        <Row label="Khung giờ" value={booking.slots.map((s) => `${s.startTime}-${s.endTime}`).join(', ')} />
        <Row label="Mã đặt sân" value={`#${booking.id.slice(-8).toUpperCase()}`} />
        <Row label="Số tiền đã trả" value={formatPrice(booking.totalPrice)} highlight />
      </div>

      <div className="w-full rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#e7f8f7', border: '1px solid rgba(0,106,101,0.2)' }}>
        <span style={{ fontSize: 20 }}>Mẹo</span>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#006a65' }}>
          Bạn có thể yêu cầu hoàn tiền tại Lịch sử đặt sân. Việc hoàn tiền tự động tức thì phụ thuộc vào thời hạn hoàn tiền của hệ thống.
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
          Xem lịch đặt của tôi
        </button>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-xl hover:bg-[#fff1eb] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
        >
          Tiếp tục tìm sân
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
      setError('Vui lòng chọn chính xác một khung giờ cho quy trình thanh toán này.');
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
      const message = err instanceof Error ? err.message : 'Không thể tạo yêu cầu thanh toán.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!payment?.id) {
      setError('Yêu cầu thanh toán chưa được khởi tạo.');
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
        setError('Thanh toán chưa hoàn tất hoặc thời gian tạm giữ sân đã hết hạn.');
        return;
      }

      setError('Thanh toán vẫn đang được xử lý. Vui lòng hoàn tất chuyển khoản và kiểm tra lại.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái thanh toán.';
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
