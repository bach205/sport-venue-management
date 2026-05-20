import type { VenueSlot } from '../types/venues.types';

function isPastSlot(slot: VenueSlot) {
  const slotStart = new Date(`${slot.date}T${slot.startTime}:00`);
  return !Number.isNaN(slotStart.getTime()) && slotStart.getTime() < Date.now();
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

interface Props {
  slots: VenueSlot[];
  selectedIds: string[];
  onToggle: (slot: VenueSlot) => void;
  loading?: boolean;
}

export function SlotGrid({ slots, selectedIds, onToggle, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl animate-pulse"
            style={{ height: 66, background: '#f4ded5' }}
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: '#8b7266', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
        No slots available for this date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(slot => {
        const isSelected = selectedIds.includes(slot.id);
        const isBooked = slot.status === 'booked';
        const isClosed = slot.status === 'closed';
        const isHeld = slot.status === 'held';
        const isUnavailable = slot.status === 'unavailable' || slot.status === 'refund_processing';
        const isPast = isPastSlot(slot);
        const disabled = isBooked || isClosed || isHeld || isUnavailable || isPast;

        let bg = '#fff';
        let border = '1.5px solid #dfc0b3';
        let textColor = '#241914';
        let priceColor = '#a04100';
        let opacity = 1;

        if (isSelected) {
          bg = '#a04100';
          border = '1.5px solid #a04100';
          textColor = '#fff';
          priceColor = 'rgba(255,255,255,0.85)';
        } else if (isHeld) {
          bg = '#f8e3d8';
          border = '1.5px solid #dfc0b3';
          textColor = '#584238';
          priceColor = '#584238';
          opacity = 0.85;
        } else if (isBooked) {
          bg = '#f4ded5';
          border = '1.5px solid #e8c4b3';
          textColor = '#8b7266';
          priceColor = '#8b7266';
          opacity = 0.7;
        } else if (isUnavailable) {
          bg = '#f7f0ed';
          border = '1.5px solid #e8c4b3';
          textColor = '#8b7266';
          priceColor = '#8b7266';
          opacity = 0.7;
        } else if (isPast) {
          bg = '#f7f0ed';
          border = '1.5px solid #e8c4b3';
          textColor = '#8b7266';
          priceColor = '#8b7266';
          opacity = 0.45;
        } else if (isClosed) {
          bg = '#f7f0ed';
          border = '1.5px solid #e8c4b3';
          textColor = '#c0a090';
          priceColor = '#c0a090';
          opacity = 0.5;
        }

        const statusLabel = isBooked
          ? 'Booked'
          : isHeld
            ? 'Held'
            : isUnavailable
              ? 'Unavailable'
              : isPast
                ? 'Expired'
              : isClosed
                ? 'Closed'
                : formatPrice(slot.price);

        return (
          <button
            key={slot.id}
            onClick={() => !disabled && onToggle(slot)}
            disabled={disabled}
            className="rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{
              height: 66,
              background: bg,
              border,
              opacity,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: textColor,
                lineHeight: 1,
              }}
            >
              {slot.startTime}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                color: isSelected ? 'rgba(255,255,255,0.7)' : '#8b7266',
              }}
            >
              → {slot.endTime}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: priceColor,
              }}
            >
              {statusLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
