import React, { useState, useEffect } from 'react';
import {
  Camera, Edit3, MapPin, Trophy, Star, Shield,
  Calendar, Zap, CheckCircle2, Lock, Loader2,
  BadgeCheck, Users, Save, X
} from 'lucide-react';
import { getCurrentUser, subscribeAuth } from '../../auth/store/authStore';
import { getProfile, updateProfile, getLevelProgress, subscribeProfile } from '../store/profileStore';
import type { UserProfile, Achievement, Gender } from '../types/profile.types';
import type { Sport, SkillLevel } from '../../discover/types/discover.types';
import { toast } from 'sonner';

type Tab = 'info' | 'achievements' | 'activity';

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'badminton', label: 'Badminton', emoji: '🏸' },
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'pickleball', label: 'Pickleball', emoji: '🏓' },
  { value: 'volleyball', label: 'Volleyball', emoji: '🏐' },
];

const SKILL_LEVELS: { value: SkillLevel; label: string; desc: string; color: string }[] = [
  { value: 'casual', label: 'Casual', desc: 'Just for fun', color: '#006a65' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Regular player', color: '#1a5fb4' },
  { value: 'competitive', label: 'Competitive', desc: 'Tournament level', color: '#a04100' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const CATEGORY_COLORS: Record<string, string> = {
  booking: '#a04100',
  social: '#1a5fb4',
  skill: '#006a65',
  loyalty: '#856404',
};
const CATEGORY_BG: Record<string, string> = {
  booking: '#fff1eb',
  social: '#ddeeff',
  skill: '#e7f8f7',
  loyalty: '#fff3cd',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Achievement Card ─────────────────────────────────────────────────────────
function AchievementCard({ ach }: { ach: Achievement }) {
  const unlocked = ach.unlockedAt !== null;
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: unlocked ? '#fff' : '#f9f4f2',
        border: `1.5px solid ${unlocked ? CATEGORY_COLORS[ach.category] + '33' : '#dfc0b3'}`,
        boxShadow: unlocked ? '0 2px 12px rgba(36,25,20,0.08)' : 'none',
        opacity: unlocked ? 1 : 0.7,
      }}
    >
      {/* Category badge */}
      <div className="absolute top-3 right-3">
        <span
          className="px-2 py-0.5 rounded-full capitalize"
          style={{
            background: CATEGORY_BG[ach.category],
            color: CATEGORY_COLORS[ach.category],
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 700,
          }}
        >
          {ach.category}
        </span>
      </div>

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: unlocked
            ? `linear-gradient(135deg, ${CATEGORY_COLORS[ach.category]}22, ${CATEGORY_COLORS[ach.category]}44)`
            : '#f0e8e3',
          filter: unlocked ? 'none' : 'grayscale(0.5)',
        }}
      >
        {unlocked ? ach.icon : <Lock size={20} style={{ color: '#8b7266' }} />}
      </div>

      {/* Title + desc */}
      <div>
        <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: unlocked ? '#241914' : '#8b7266' }}>
          {ach.title}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 2, lineHeight: 1.4 }}>
          {ach.description}
        </p>
      </div>

      {/* XP / date */}
      {unlocked ? (
        <div className="flex items-center justify-between">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: '#fff1eb', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#a04100' }}
          >
            <Zap size={10} /> +{ach.xp} XP
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>
            {formatDate(ach.unlockedAt!)}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>{ach.requirement}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a04100', fontWeight: 600 }}>
              {ach.xp} XP
            </span>
          </div>
          {ach.progress !== undefined && (
            <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: '#f0e8e3' }}>
              <div
                style={{
                  height: '100%',
                  width: `${ach.progress}%`,
                  borderRadius: '9999px',
                  background: `linear-gradient(90deg, ${CATEGORY_COLORS[ach.category]}, ${CATEGORY_COLORS[ach.category]}99)`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────
function EditForm({ profile, onSave, onCancel }: {
  profile: UserProfile;
  onSave: (patch: Partial<UserProfile>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    displayName: profile.displayName,
    bio: profile.bio,
    age: profile.age ?? '',
    gender: profile.gender,
    city: profile.city,
    sportPreferences: [...profile.sportPreferences],
    skillLevel: profile.skillLevel,
  });
  const [saving, setSaving] = useState(false);

  const toggleSport = (s: Sport) => {
    setForm(f => ({
      ...f,
      sportPreferences: f.sportPreferences.includes(s)
        ? f.sportPreferences.filter(x => x !== s)
        : [...f.sportPreferences, s],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    onSave({ ...form, age: form.age ? Number(form.age) : null });
    setSaving(false);
  };

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
    <div className="flex flex-col gap-5">
      {/* Name + Bio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            Display Name *
          </label>
          <input
            style={inputStyle}
            value={form.displayName}
            onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = '#006a65'; }}
            onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
          />
        </div>
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            City / Location
          </label>
          <input
            style={inputStyle}
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = '#006a65'; }}
            onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            placeholder="e.g. Ho Chi Minh City"
          />
        </div>
      </div>

      <div>
        <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
          Bio
        </label>
        <textarea
          style={{ ...inputStyle, resize: 'none' }}
          rows={3}
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          onFocus={e => { e.target.style.borderColor = '#006a65'; }}
          onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
          placeholder="Tell the community about yourself..."
          maxLength={200}
        />
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', textAlign: 'right', marginTop: 4 }}>
          {form.bio.length}/200
        </p>
      </div>

      {/* Age + Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            Age
          </label>
          <input
            style={inputStyle}
            type="number"
            min={10}
            max={80}
            value={form.age}
            onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            onFocus={e => { e.target.style.borderColor = '#006a65'; }}
            onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
            placeholder="Your age"
          />
        </div>
        <div>
          <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 6 }}>
            Gender
          </label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.gender}
            onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}
            onFocus={e => { e.target.style.borderColor = '#006a65'; }}
            onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
          >
            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
      </div>

      {/* Sport preferences */}
      <div>
        <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 8 }}>
          Sport Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(s => {
            const active = form.sportPreferences.includes(s.value);
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSport(s.value)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: active ? '#a04100' : '#fff',
                  border: `1.5px solid ${active ? '#a04100' : '#dfc0b3'}`,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#fff' : '#584238',
                }}
              >
                {s.emoji} {s.label}
                {active && <CheckCircle2 size={13} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skill level */}
      <div>
        <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#241914', display: 'block', marginBottom: 8 }}>
          Skill Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SKILL_LEVELS.map(sl => {
            const active = form.skillLevel === sl.value;
            return (
              <button
                key={sl.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, skillLevel: sl.value }))}
                className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: active ? sl.color : '#dfc0b3',
                  background: active ? sl.color + '15' : '#fff',
                }}
              >
                <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: active ? sl.color : '#241914' }}>
                  {sl.label}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>{sl.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 h-11 px-5 rounded-xl transition-colors hover:bg-[#fff1eb]"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
        >
          <X size={15} /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-11 px-6 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{
            background: 'linear-gradient(90deg,#a04100,#ff7e36)',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(160,65,0,0.3)',
          }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [authUser, setAuthUser] = useState(getCurrentUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>('info');
  const [editing, setEditing] = useState(false);
  const [achFilter, setAchFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => subscribeAuth(() => setAuthUser(getCurrentUser())), []);

  useEffect(() => {
    if (!authUser) return;
    const p = getProfile(authUser.id);
    setProfile(p);
    return subscribeProfile(() => setProfile(getProfile(authUser.id)));
  }, [authUser]);

  if (!authUser || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Shield size={40} style={{ color: '#dfc0b3' }} />
        <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', color: '#241914' }}>
          Please log in to view your profile
        </p>
      </div>
    );
  }

  const xpInfo = getLevelProgress(profile.xp);
  const unlockedCount = profile.achievements.filter(a => a.unlockedAt !== null).length;
  const totalXp = profile.achievements.filter(a => a.unlockedAt !== null).reduce((s, a) => s + a.xp, 0);
  const filteredAch = profile.achievements.filter(a => {
    if (achFilter === 'unlocked') return a.unlockedAt !== null;
    if (achFilter === 'locked') return a.unlockedAt === null;
    return true;
  });

  const handleSave = (patch: Partial<UserProfile>) => {
    const updated = updateProfile(authUser.id, patch);
    if (updated) {
      setProfile(updated);
      setEditing(false);
      toast.success('Profile updated successfully!');
    }
  };

  const TABS = [
    { id: 'info' as Tab, label: 'Personal Info', icon: <Edit3 size={15} /> },
    { id: 'achievements' as Tab, label: `Achievements (${unlockedCount}/${profile.achievements.length})`, icon: <Trophy size={15} /> },
    { id: 'activity' as Tab, label: 'Activity', icon: <Calendar size={15} /> },
  ];

  const ROLE_BADGE = {
    player: { label: 'Người chơi', bg: '#d0f5ee', color: '#00785e' },
    owner: { label: 'Chủ sân', bg: '#ddeeff', color: '#1a5fb4' },
    admin: { label: 'Admin', bg: '#ffd6d6', color: '#c0392b' },
  };
  const badge = ROLE_BADGE[authUser.role];

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#fff8f6' }}>
      {/* ─── Cover + Avatar ─── */}
      <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
        <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(36,25,20,0.65))' }} />
        {/* Edit cover button */}
        <button
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '13px', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <Camera size={14} /> Change Cover
        </button>
      </div>

      {/* ─── Profile Header ─── */}
      <div className="max-w-screen-lg mx-auto w-full px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 mb-6 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-[#fff8f6]"
              style={{ boxShadow: '0 4px 16px rgba(36,25,20,0.2)' }}
            >
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" style={{ background: '#f4ded5' }} />
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#a04100', border: '2px solid #fff8f6' }}
            >
              <Camera size={12} color="#fff" />
            </button>
          </div>

          {/* Name + meta */}
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '24px', fontWeight: 800, color: '#241914' }}>
                {profile.displayName}
              </h1>
              {profile.isVerified && (
                <BadgeCheck size={20} style={{ color: '#006a65' }} />
              )}
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{ background: badge.bg, color: badge.color, fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}
              >
                {badge.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
                <MapPin size={13} style={{ color: '#a04100' }} /> {profile.city}
              </span>
              <span className="flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
                <Calendar size={13} style={{ color: '#a04100' }} /> Joined {formatDate(profile.joinedAt)}
              </span>
              <span className="flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>
                <Star size={13} fill="#a04100" color="#a04100" /> {profile.rating} ({profile.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => { setTab('info'); setEditing(true); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl transition-all hover:opacity-90 shrink-0"
            style={{
              background: 'linear-gradient(90deg,#a04100,#ff7e36)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              color: '#fff',
              border: 'none',
            }}
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        {/* ─── Stats row ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '🏸', label: 'Sport', value: profile.sportPreferences.slice(0, 2).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') || '–' },
            { icon: '⚡', label: 'Skill Level', value: profile.skillLevel.charAt(0).toUpperCase() + profile.skillLevel.slice(1) },
            { icon: '📅', label: 'Total Bookings', value: `${profile.totalBookings}` },
            { icon: '🤝', label: 'Matches Played', value: `${profile.totalMatchesPlayed}` },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: '#fff', border: '1px solid #dfc0b3' }}
            >
              <span className="text-xl">{s.icon}</span>
              <div>
                <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#241914' }}>{s.value}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Level / XP bar ─── */}
        <div
          className="rounded-2xl p-5 mb-6 flex items-center gap-5"
          style={{ background: '#fff', border: '1px solid #dfc0b3' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)', boxShadow: '0 4px 12px rgba(160,65,0,0.35)' }}
          >
            <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {xpInfo.level}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em' }}>
              LEVEL
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#241914' }}>
                Level {xpInfo.level}
                {xpInfo.level < 50 && <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: '#8b7266', fontSize: '13px' }}> → {xpInfo.level + 1}</span>}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100', fontWeight: 600 }}>
                {xpInfo.currentXp} / {xpInfo.nextLevelXp} XP
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 10, background: '#f4ded5' }}>
              <div
                style={{
                  height: '100%',
                  width: `${xpInfo.pct}%`,
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>
                {unlockedCount} achievements · {totalXp} total XP
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#a04100', fontWeight: 600 }}>
                {xpInfo.pct}%
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} style={{ color: '#a04100' }} />
              <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '15px', fontWeight: 700, color: '#a04100' }}>
                {unlockedCount}/{profile.achievements.length}
              </span>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>Achievements</span>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex border-b border-[#dfc0b3] mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setEditing(false); }}
              className="flex items-center gap-2 px-4 py-3 transition-colors"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? '#a04100' : '#584238',
                borderBottom: tab === t.id ? '2.5px solid #a04100' : '2.5px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ─── Personal Info Tab ─── */}
        {tab === 'info' && (
          <div className="pb-12">
            {editing ? (
              <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
                <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914', marginBottom: 20 }}>
                  Edit Profile
                </h2>
                <EditForm profile={profile} onSave={handleSave} onCancel={() => setEditing(false)} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: bio + info */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  {/* Bio */}
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700, color: '#241914' }}>About Me</h3>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1 px-3 h-8 rounded-lg hover:bg-[#fff1eb] transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100', fontWeight: 600 }}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', lineHeight: 1.7 }}>
                      {profile.bio || <span style={{ color: '#8b7266', fontStyle: 'italic' }}>No bio yet. Click Edit to add one!</span>}
                    </p>
                  </div>

                  {/* Info grid */}
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
                    <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700, color: '#241914', marginBottom: 16 }}>
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                      {[
                        { label: 'Age', value: profile.age ? `${profile.age} years old` : '—' },
                        { label: 'Gender', value: profile.gender === 'prefer_not_to_say' ? 'Prefer not to say' : profile.gender?.charAt(0).toUpperCase() + profile.gender?.slice(1) || '—' },
                        { label: 'City', value: profile.city || '—' },
                        { label: 'Skill Level', value: profile.skillLevel?.charAt(0).toUpperCase() + profile.skillLevel?.slice(1) || '—' },
                        { label: 'Member Since', value: formatDate(profile.joinedAt) },
                        { label: 'Account Status', value: profile.isVerified ? '✅ Verified' : 'Unverified' },
                      ].map((item, i) => (
                        <div key={i}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            {item.label}
                          </p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#241914' }}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: sports */}
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
                    <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700, color: '#241914', marginBottom: 12 }}>
                      Sport Preferences
                    </h3>
                    {profile.sportPreferences.length === 0 ? (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266', fontStyle: 'italic' }}>No sports added yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profile.sportPreferences.map(s => {
                          const info = SPORTS.find(x => x.value === s);
                          return (
                            <span
                              key={s}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                              style={{ background: '#fff1eb', border: '1.5px solid rgba(160,65,0,0.2)', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#a04100', fontWeight: 600 }}
                            >
                              {info?.emoji} {info?.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #dfc0b3' }}>
                    <h3 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700, color: '#241914', marginBottom: 12 }}>
                      Performance
                    </h3>
                    {[
                      { label: 'Court Bookings', value: profile.totalBookings, icon: '📅' },
                      { label: 'Matches Played', value: profile.totalMatchesPlayed, icon: '🤝' },
                      { label: 'Community Rating', value: `${profile.rating} ⭐`, icon: '🌟' },
                      { label: 'Reviews Received', value: profile.reviewCount, icon: '💬' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-[#f4ded5]' : ''}`}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>{item.icon} {item.label}</span>
                        <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '15px', fontWeight: 700, color: '#241914' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Achievements Tab ─── */}
        {tab === 'achievements' && (
          <div className="pb-12">
            {/* Summary bar */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: '#fff1eb', border: '1px solid rgba(160,65,0,0.15)' }}
              >
                <Trophy size={18} style={{ color: '#a04100' }} />
                <div>
                  <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 800, color: '#a04100', lineHeight: 1 }}>
                    {unlockedCount}/{profile.achievements.length}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>Unlocked</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#fff1eb', border: '1px solid rgba(160,65,0,0.15)' }}>
                <Zap size={18} style={{ color: '#a04100' }} />
                <div>
                  <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 800, color: '#a04100', lineHeight: 1 }}>
                    {totalXp} XP
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>From achievements</p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                {(['all', 'unlocked', 'locked'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAchFilter(f)}
                    className="px-3 h-9 rounded-xl capitalize transition-all"
                    style={{
                      background: achFilter === f ? '#a04100' : '#fff',
                      border: `1.5px solid ${achFilter === f ? '#a04100' : '#dfc0b3'}`,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: achFilter === f ? 700 : 400,
                      color: achFilter === f ? '#fff' : '#584238',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAch.map(ach => <AchievementCard key={ach.id} ach={ach} />)}
            </div>
          </div>
        )}

        {/* ─── Activity Tab ─── */}
        {tab === 'activity' && (
          <div className="pb-12">
            {profile.recentActivity.length === 0 ? (
              <div className="text-center py-16">
                <Calendar size={48} style={{ color: '#dfc0b3', margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#8b7266' }}>No activity yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {profile.recentActivity.map((item, idx) => {
                  const TYPE_COLOR: Record<string, string> = {
                    booking: '#a04100',
                    match: '#006a65',
                    message: '#1a5fb4',
                    achievement: '#856404',
                  };
                  const TYPE_BG: Record<string, string> = {
                    booking: '#fff1eb',
                    match: '#e7f8f7',
                    message: '#ddeeff',
                    achievement: '#fff3cd',
                  };
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-4 rounded-xl"
                      style={{ background: '#fff', border: '1px solid #dfc0b3' }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: TYPE_BG[item.type] }}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#241914' }}>
                          {item.title}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266', marginTop: 1 }}>
                          {item.subtitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-full capitalize"
                          style={{ background: TYPE_BG[item.type], color: TYPE_COLOR[item.type], fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700 }}
                        >
                          {item.type}
                        </span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266' }}>
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}