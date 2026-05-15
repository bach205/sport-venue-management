import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, SlidersHorizontal, Loader2 } from 'lucide-react';
import { fetchPosts } from '../api/discoverApi';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import type { DiscoverPost, DiscoverFilters, Sport, SkillLevel, PostType } from '../types/discover.types';

const SPORT_OPTIONS = [
  { value: 'all', label: 'All Sports' },
  { value: 'tennis', label: '🎾 Tennis' },
  { value: 'basketball', label: '🏀 Basketball' },
  { value: 'badminton', label: '🏸 Badminton' },
  { value: 'football', label: '⚽ Football' },
  { value: 'pickleball', label: '🏓 Pickleball' },
  { value: 'volleyball', label: '🏐 Volleyball' },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>({
    sport: 'all',
    skillLevel: 'all',
    type: 'all',
    search: '',
  });

  const loadPosts = async () => {
    setLoading(true);
    const res = await fetchPosts();
    if (res.success) {
      setPosts(res.data);
    } else {
      setPosts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filtered = posts.filter(post => {
    if (filters.sport !== 'all' && post.sport !== filters.sport) return false;
    if (filters.skillLevel !== 'all' && post.skillLevel !== filters.skillLevel) return false;
    if (filters.type !== 'all' && post.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !post.author.name.toLowerCase().includes(q) &&
        !post.location.toLowerCase().includes(q) &&
        !post.description.toLowerCase().includes(q) &&
        !post.sport.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const handleContactNow = (post: DiscoverPost) => {
    navigate(
      `/messages?with=${post.author.id}&name=${encodeURIComponent(post.author.name)}&avatar=${encodeURIComponent(post.author.avatar)}&sport=${post.sport}`
    );
  };

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
      {/* Page header */}
      <div className="border-b border-[#dfc0b3] bg-[#fff8f6]">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 700, color: '#241914' }}>
                Discover
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 4 }}>
                Find players, post your game, connect with the community
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-11 px-5 rounded-xl transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background: 'linear-gradient(90deg, #a04100 0%, #ff7e36 100%)',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                border: 'none',
              }}
            >
              <Plus size={16} />
              Create Post
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#8b7266' }}
              />
              <input
                type="text"
                placeholder="Search sport, location, player..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ ...selectStyle, paddingLeft: '34px', width: '100%', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#006a65'; }}
                onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
              />
            </div>
            <SlidersHorizontal size={14} style={{ color: '#8b7266' }} />
            <select
              value={filters.sport}
              onChange={e => setFilters(f => ({ ...f, sport: e.target.value as Sport | 'all' }))}
              style={selectStyle}
            >
              {SPORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filters.skillLevel}
              onChange={e => setFilters(f => ({ ...f, skillLevel: e.target.value as SkillLevel | 'all' }))}
              style={selectStyle}
            >
              <option value="all">All Levels</option>
              <option value="casual">Casual</option>
              <option value="intermediate">Intermediate</option>
              <option value="competitive">Competitive</option>
            </select>
            <select
              value={filters.type}
              onChange={e => setFilters(f => ({ ...f, type: e.target.value as PostType | 'all' }))}
              style={selectStyle}
            >
              <option value="all">Teammate & Opponent</option>
              <option value="teammate">Looking for Teammate</option>
              <option value="opponent">Looking for Opponent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div className="max-w-screen-xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: '#a04100' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🏃</span>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 600, color: '#241914' }}>
              No posts found
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266', marginTop: 8 }}>
              Try adjusting your filters or be the first to post!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 h-11 px-6 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(90deg, #a04100 0%, #ff7e36 100%)',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                border: 'none',
              }}
            >
              <Plus size={16} />
              Create Post
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginBottom: '20px' }}>
              {filtered.length} {filtered.length === 1 ? 'post' : 'posts'} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(post => (
                <PostCard key={post.id} post={post} onContactNow={handleContactNow} />
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            loadPosts();
          }}
        />
      )}
    </div>
  );
}
