import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, Loader2, CalendarDays } from 'lucide-react';
import { fetchVenues } from '../api/venuesApi';
import { VenueCard } from '../components/VenueCard';
import type { Venue, Sport } from '../types/venues.types';

const SPORT_OPTIONS = [
  { value: 'all', label: 'All Sports' },
  { value: 'tennis', label: '🎾 Tennis' },
  { value: 'basketball', label: '🏀 Basketball' },
  { value: 'badminton', label: '🏸 Badminton' },
  { value: 'football', label: '⚽ Football' },
  { value: 'pickleball', label: '🏓 Pickleball' },
  { value: 'volleyball', label: '🏐 Volleyball' },
];

const DISTRICTS = ['all', 'District 1', 'Binh Thanh', 'Go Vap', 'Thu Duc', 'District 7', 'Vung Tau'];

export default function VenuesPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState<Sport | 'all'>('all');
  const [district, setDistrict] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetchVenues({ sport, district, search });
    if (res.success) setVenues(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sport, district, search]);

  const selectStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: '#241914',
    border: '1.5px solid #dfc0b3',
    borderRadius: '10px',
    padding: '8px 12px',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff8f6' }}>
      {/* Header */}
      <div className="border-b border-[#dfc0b3] bg-[#fff8f6]">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1
                style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 700, color: '#241914' }}
              >
                Sports Venues
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 4 }}>
                Browse, book courts & fields near you in real time
              </p>
            </div>
            <button
              onClick={() => navigate('/bookings')}
              className="flex items-center gap-2 h-11 px-5 rounded-xl border border-[#dfc0b3] hover:bg-[#fff1eb] transition-colors"
              style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#241914',
                background: '#fff',
              }}
            >
              <CalendarDays size={16} />
              My Bookings
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8b7266' }} />
              <input
                type="text"
                placeholder="Search venue, location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...selectStyle, paddingLeft: '34px', width: '100%', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#006a65'; }}
                onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
              />
            </div>
            <SlidersHorizontal size={14} style={{ color: '#8b7266' }} />
            <select value={sport} onChange={e => setSport(e.target.value as Sport | 'all')} style={selectStyle}>
              {SPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={selectStyle}>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d === 'all' ? 'All Districts' : d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Venue Grid */}
      <div className="max-w-screen-xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: '#a04100' }} />
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🏟️</span>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 600, color: '#241914' }}>
              No venues found
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266', marginTop: 8 }}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginBottom: '20px' }}>
              {venues.length} venue{venues.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {venues.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onClick={() => navigate(`/venues/${venue.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
