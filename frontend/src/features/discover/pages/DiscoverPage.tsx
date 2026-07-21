import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, SlidersHorizontal, Loader2 } from 'lucide-react';
import { fetchPosts } from '../api/discoverApi';
import type { FetchPostsParams } from '../api/discoverApi';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import type { DiscoverPost, DiscoverFilters, Sport, SkillLevel, PostType } from '../types/discover.types';
import { SPORT_OPTIONS as BASE_SPORT_OPTIONS } from '@/shared/constants/matchOptions';
import { useTranslation } from 'react-i18next';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';

const PAGE_SIZE = 50;

export default function DiscoverPage() {
  const { t } = useTranslation('matching');
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();

  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState<DiscoverFilters>({
    sport: 'all',
    skillLevel: 'all',
    type: 'all',
    search: '',
  });

  // Build API params from current filters
  const buildParams = useCallback(
    (page: number): FetchPostsParams => ({
      page,
      limit: PAGE_SIZE,
      sport: filters.sport !== 'all' ? filters.sport : undefined,
      skill_level: filters.skillLevel !== 'all' ? filters.skillLevel : undefined,
      match_type: filters.type !== 'all' ? filters.type : undefined,
      search: filters.search || undefined,
    }),
    [filters]
  );

  // Initial load + reload when filters change
  const loadFirstPage = async () => {
    setLoading(true);
    setPosts([]);
    pageRef.current = 1;
    setHasMore(true);

    const res = await fetchPosts(buildParams(1));
    if (res.success) {
      setPosts(res.data);
      setTotal(res.pagination?.total ?? 0);
      setHasMore((res.pagination?.pages ?? 1) > 1);
    }
    setLoading(false);
  };

  // Load next page (infinite scroll)
  const loadNextPage = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;

    const res = await fetchPosts(buildParams(nextPage));
    if (res.success && res.data.length > 0) {
      setPosts((prev) => [...prev, ...res.data]);
      pageRef.current = nextPage;
      setHasMore((res.pagination?.pages ?? 0) > nextPage);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  // Reset and reload on filter change
  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sport, filters.skillLevel, filters.type, filters.search]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore]);

  const handleContactNow = (post: DiscoverPost) => {
    if (!requireAuth()) return;
    navigate(
      `/messages?with=${post.author.id}&name=${encodeURIComponent(post.author.name)}&avatar=${encodeURIComponent(post.author.avatar)}&sport=${post.sport}`
    );
  };

  const handleCreatePost = () => {
    if (!requireAuth()) return;
    setShowModal(true);
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

  const sportOptions = [
    { value: 'all', label: t('discover.filters.allSports') },
    ...BASE_SPORT_OPTIONS.map((sport) => ({
      value: sport.value,
      label: `${sport.emoji} ${t(`sports.${sport.value}`, sport.label)}`,
    })),
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff8f6' }}>
      {/* Page header */}
      <div className="border-b border-[#dfc0b3] bg-[#fff8f6]">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 700, color: '#241914' }}>
                {t('discover.title')}
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 4 }}>
                {t('discover.subtitle')}
              </p>
            </div>
            <button
              onClick={handleCreatePost}
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
              {t('discover.createPost')}
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
                placeholder={t('discover.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                style={{ ...selectStyle, paddingLeft: '34px', width: '100%', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#006a65'; }}
                onBlur={(e) => { e.target.style.borderColor = '#dfc0b3'; }}
              />
            </div>
            <SlidersHorizontal size={14} style={{ color: '#8b7266' }} />
            <select
              value={filters.sport}
              onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value as Sport | 'all' }))}
              style={selectStyle}
            >
              {sportOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filters.skillLevel}
              onChange={(e) => setFilters((f) => ({ ...f, skillLevel: e.target.value as SkillLevel | 'all' }))}
              style={selectStyle}
            >
              <option value="all">{t('discover.filters.allLevels')}</option>
              <option value="casual">{t('skillLevels.casual.label')}</option>
              <option value="intermediate">{t('skillLevels.intermediate.label')}</option>
              <option value="competitive">{t('skillLevels.competitive.label')}</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as PostType | 'all' }))}
              style={selectStyle}
            >
              <option value="all">{t('discover.filters.allTypes')}</option>
              <option value="teammate">{t('discover.filters.teammate')}</option>
              <option value="opponent">{t('discover.filters.opponent')}</option>
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
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🏃</span>
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 600, color: '#241914' }}>
              {t('discover.emptyTitle')}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266', marginTop: 8 }}>
              {t('discover.emptySubtitle')}
            </p>
            <button
              onClick={handleCreatePost}
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
              {t('discover.createPost')}
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', marginBottom: '20px' }}>
              {t('discover.postsFound', { count: total })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onContactNow={handleContactNow} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {loadingMore && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin" style={{ color: '#a04100' }} />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="text-center py-8" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266' }}>
                {t('feed.end', { count: total })}
              </p>
            )}
          </>
        )}
      </div>

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            loadFirstPage();
          }}
        />
      )}
    </div>
  );
}