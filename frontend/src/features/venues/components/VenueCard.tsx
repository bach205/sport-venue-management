import { Star, MapPin, Clock, Users, Phone } from 'lucide-react';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import type { Venue } from '../types/venues.types';
import { useTranslation } from 'react-i18next';

const SPORT_EMOJI: Record<string, string> = {
  tennis: '🎾',
  basketball: '🏀',
  badminton: '🏸',
  football: '⚽',
  pickleball: '🏓',
  volleyball: '🏐',
};

function formatPrice(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n) + '₫';
}

function formatAvailabilityDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function AvailabilityChip({ label, value, tone }: { label: string; value: number; tone: 'green' | 'orange' | 'gray' }) {
  const styles = {
    green: { background: '#e7f8f7', color: '#006a65', border: '1px solid rgba(0,106,101,0.18)' },
    orange: { background: '#fff1eb', color: '#a04100', border: '1px solid rgba(160,65,0,0.15)' },
    gray: { background: '#f7f0ed', color: '#8b7266', border: '1px solid #e8c4b3' },
  } as const;

  return (
    <span
      className="px-2 py-0.5 rounded-md"
      style={{
        ...styles[tone],
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      {value} {label}
    </span>
  );
}

interface Props {
  venue: Venue;
  onClick: () => void;
}

export function VenueCard({ venue, onClick }: Props) {
  const { t, i18n } = useTranslation('matching');
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';
  const availability = venue.availabilitySummary;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl overflow-hidden border border-[#dfc0b3] bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ boxShadow: '0 2px 8px rgba(36,25,20,0.07)' }}
    >
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <ImageWithFallback
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {venue.sports.slice(0, 2).map((s) => (
            <span
              key={s}
              className="px-2 py-1 rounded-lg text-white"
              style={{
                background: 'rgba(36,25,20,0.6)',
                backdropFilter: 'blur(6px)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {SPORT_EMOJI[s]} {t(`sports.${s}`, s)}
            </span>
          ))}
        </div>
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-lg"
          style={{
            background: 'linear-gradient(90deg,#a04100,#ff7e36)',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {t('venues.card.priceFrom', { price: formatPrice(venue.priceFrom, locale) })}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="flex-1"
            style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: '#241914',
            }}
          >
            {venue.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={13} fill="#a04100" color="#a04100" />
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: '#241914',
              }}
            >
              {venue.rating}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>
              ({venue.reviewCount})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin size={13} style={{ color: '#8b7266', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
            {venue.shortAddress}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Phone size={13} style={{ color: '#8b7266', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
            {venue.phoneNumber}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ color: '#8b7266' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>
              {venue.openHours}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} style={{ color: '#8b7266' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>
              {t('venues.card.courts', { count: venue.courtCount })}
            </span>
          </div>
        </div>

        {availability && (
          <div className="pt-1">
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                color: '#8b7266',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              {t('venues.card.availability', { date: formatAvailabilityDate(availability.date, locale) })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <AvailabilityChip label={t('venues.status.available')} value={availability.availableSlots} tone="green" />
              <AvailabilityChip label={t('venues.status.booked')} value={availability.bookedSlots} tone="orange" />
              <AvailabilityChip label={t('venues.status.unavailable')} value={availability.unavailableSlots} tone="gray" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
