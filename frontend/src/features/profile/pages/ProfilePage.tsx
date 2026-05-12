import React, { useState, useEffect } from 'react';
import {
  Camera, Edit3, MapPin, Trophy, Star,
  Calendar, Zap, CheckCircle2, Lock, Loader2,
  BadgeCheck, Save, X,
  Verified,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { patchUser } from '../../auth/store/authSlice';
import {
  fetchProfileStart, fetchProfileSuccess, fetchProfileFailed, updateProfileData,
} from '../store/profileSlice';
import { getMe, updateProfile } from '../api/profileApi';
import { getLevelProgress, getFEOnlyData } from '../store/profileStore';
import type { UserProfile, Achievement, Gender, SkillLevel, Sport } from '../types/profile.types';
import type { ApiUser, UpdateProfilePayload } from '../../auth/types/auth.types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'info' | 'achievements' | 'activity';

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'tennis',       label: 'Tennis',       emoji: '🎾' },
  { value: 'basketball',   label: 'Basketball',   emoji: '🏀' },
  { value: 'badminton',    label: 'Badminton',    emoji: '🏸' },
  { value: 'football',     label: 'Football',     emoji: '⚽' },
  { value: 'pickleball',   label: 'Pickleball',   emoji: '🏓' },
  { value: 'volleyball',   label: 'Volleyball',   emoji: '🏐' },
  { value: 'swimming',     label: 'Swimming',     emoji: '🏊' },
  { value: 'table_tennis', label: 'Table Tennis', emoji: '🏓' },
];

const SKILL_LEVELS: { value: SkillLevel; label: string; desc: string; active: string }[] = [
  { value: 'casual',       label: 'Casual',       desc: 'Just for fun',     active: 'bg-brand-teal/15 border-brand-teal text-brand-teal' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Regular player',   active: 'bg-brand-navy/10 border-brand-navy text-brand-navy' },
  { value: 'competitive',  label: 'Competitive',  desc: 'Tournament level', active: 'bg-brand-orange/10 border-brand-orange text-brand-orange' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'other',             label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const CATEGORY_CONFIG: Record<string, { color: string; textClass: string; bgClass: string }> = {
  booking: { color: '#a04100', textClass: 'text-brand-orange', bgClass: 'bg-brand-surface-orange' },
  social:  { color: '#1a5fb4', textClass: 'text-brand-navy',   bgClass: 'bg-[#ddeeff]' },
  skill:   { color: '#006a65', textClass: 'text-brand-teal',   bgClass: 'bg-brand-surface-teal' },
  loyalty: { color: '#856404', textClass: 'text-[#856404]',    bgClass: 'bg-[#fff3cd]' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Achievement Card ─────────────────────────────────────────────────────────

function AchievementCard({ ach }: { ach: Achievement }) {
  const unlocked = ach.unlockedAt !== null;
  const cat = CATEGORY_CONFIG[ach.category];
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-0.5
        ${unlocked ? 'bg-white border-[1.5px]' : 'bg-[#f9f4f2] border border-brand-border opacity-70'}`}
      style={unlocked ? { borderColor: cat.color + '33', boxShadow: '0 2px 12px rgba(36,25,20,0.08)' } : undefined}
    >
      <div className="absolute top-3 right-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${cat.bgClass} ${cat.textClass}`}>
          {ach.category}
        </span>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${cat.bgClass} ${!unlocked ? 'grayscale-[50%]' : ''}`}>
        {unlocked ? ach.icon : <Lock size={20} className="text-brand-muted" />}
      </div>
      <div>
        <p className={`text-sm font-bold font-heading ${unlocked ? 'text-brand-dark' : 'text-brand-muted'}`}>{ach.title}</p>
        <p className="text-xs text-brand-muted mt-0.5 leading-snug">{ach.description}</p>
      </div>
      {unlocked ? (
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cat.bgClass} ${cat.textClass}`}>
            <Zap size={10} /> +{ach.xp} XP
          </span>
          <span className="text-[11px] text-brand-muted">{formatDate(ach.unlockedAt!)}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-brand-muted">{ach.requirement}</span>
            <span className={`text-[11px] font-semibold ${cat.textClass}`}>{ach.xp} XP</span>
          </div>
          {ach.progress !== undefined && (
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-brand-surface-warm">
              <div className="h-full rounded-full" style={{ width: `${ach.progress}%`, background: cat.color }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Form (pure UI — API call is in ProfilePage.handleSave) ──────────────

function EditForm({
  profile,
  onSave,
  onCancel,
  saving,
}: {
  profile: UserProfile;
  onSave: (payload: UpdateProfilePayload) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name:             profile.name,
    age:              profile.age !== null ? String(profile.age) : '',
    gender:           profile.gender,
    location:         profile.location,
    sport_preference: [...profile.sport_preference],
    skill_level:      profile.skill_level,
  });

  const toggleSport = (s: Sport) =>
    setForm(f => ({
      ...f,
      sport_preference: f.sport_preference.includes(s)
        ? f.sport_preference.filter(x => x !== s)
        : [...f.sport_preference, s],
    }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave({
      name:             form.name.trim(),
      age:              form.age !== '' ? Number(form.age) : null,
      gender:           form.gender,
      location:         form.location.trim(),
      sport_preference: form.sport_preference,
      skill_level:      form.skill_level,
    });
  };

  const inputCls = 'w-full border-[1.5px] border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-dark bg-white outline-none focus:border-brand-teal transition-colors';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[13px] font-semibold text-brand-dark block mb-1.5">Display Name *</label>
          <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-brand-dark block mb-1.5">Location</label>
          <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Ho Chi Minh City" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[13px] font-semibold text-brand-dark block mb-1.5">Age</label>
          <input className={inputCls} type="number" min={10} max={80} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Your age" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-brand-dark block mb-1.5">Gender</label>
          <select className={inputCls + ' cursor-pointer'} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}>
            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-brand-dark block mb-2">
          Sport Preferences <span className="font-mono font-normal text-brand-muted text-[11px]">(sport_preference)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(s => {
            const active = form.sport_preference.includes(s.value);
            return (
              <button key={s.value} type="button" onClick={() => toggleSport(s.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] transition-all border-[1.5px]
                  ${active ? 'bg-brand-orange border-brand-orange text-white font-bold' : 'bg-white border-brand-border text-brand-body hover:border-brand-orange'}`}>
                {s.emoji} {s.label} {active && <CheckCircle2 size={13} />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-brand-dark block mb-2">
          Skill Level <span className="font-mono font-normal text-brand-muted text-[11px]">(skill_level)</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SKILL_LEVELS.map(sl => {
            const active = form.skill_level === sl.value;
            return (
              <button key={sl.value} type="button" onClick={() => setForm(f => ({ ...f, skill_level: sl.value }))}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all
                  ${active ? sl.active : 'bg-white border-brand-border text-brand-dark'}`}>
                <span className="text-sm font-bold font-heading">{sl.label}</span>
                <span className="text-[11px] text-brand-muted">{sl.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel}
          className="flex items-center gap-2 h-11 px-5 rounded-xl border-[1.5px] border-brand-border text-brand-body text-sm hover:bg-brand-surface-orange transition-colors">
          <X size={15} /> Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving || !form.name.trim()}
          className="flex items-center gap-2 h-11 px-6 rounded-xl gradient-orange text-white font-heading text-sm font-bold hover:opacity-90 disabled:opacity-70 transition-opacity"
          style={{ boxShadow: '0 4px 14px rgba(160,65,0,0.3)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const dispatch   = useAppDispatch();
  const authUser   = useAppSelector(state => state.auth.user);
  const profile    = useAppSelector(state => state.profile.data);
  const status     = useAppSelector(state => state.profile.status);

  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState<Tab>('info');
  const [editing,   setEditing]   = useState(false);
  const [achFilter, setAchFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // ── Fetch profile from API on mount (refresh stale-while-revalidate) ─────────
  useEffect(() => {
    if (!authUser) return;

    // Only show spinner on initial fetch (no cached data in store yet)
    if (!profile) dispatch(fetchProfileStart());

    getMe().then(res => {
      if (res.success && res.data) {
        const { user, profile: apiProfile } = res.data;
        const feData  = getFEOnlyData(authUser._id);
        const userId  = typeof apiProfile.user_id === 'string'
          ? apiProfile.user_id
          : (apiProfile.user_id as ApiUser)._id;

        dispatch(fetchProfileSuccess({
          // FE-only display fields (from local mock catalogue)
          ...feData,
          // API fields (authoritative — overwrite FE defaults)
          _id:              apiProfile._id,
          user_id:          userId,
          name:             apiProfile.name,
          age:              apiProfile.age ?? null,
          gender:           (apiProfile.gender ?? 'prefer_not_to_say') as Gender,
          sport_preference: (apiProfile.sport_preference ?? []) as Sport[],
          skill_level:      (apiProfile.skill_level ?? 'casual') as SkillLevel,
          location:         apiProfile.location ?? '',
          reputation_score: apiProfile.reputation_score,
          is_verified:      user.is_verified,
        }));
      } else {
        dispatch(fetchProfileFailed(res.message));
        toast.error(res.message);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id]);

  // ── Handle profile update ─────────────────────────────────────────────────────
  const handleSave = async (payload: UpdateProfilePayload) => {
    setSaving(true);
    const res = await updateProfile(payload);
    if (res.success && res.data) {
      const apiProfile = res.data;
      dispatch(updateProfileData({
        name:             apiProfile.name,
        age:              apiProfile.age ?? null,
        gender:           (apiProfile.gender ?? profile?.gender) as Gender,
        sport_preference: (apiProfile.sport_preference ?? profile?.sport_preference) as Sport[],
        skill_level:      (apiProfile.skill_level ?? profile?.skill_level) as SkillLevel,
        location:         apiProfile.location ?? profile?.location ?? '',
        reputation_score: apiProfile.reputation_score,
      }));
      // Keep authUser.name in sync (displayed in NavBar, etc.)
      dispatch(patchUser({ name: apiProfile.name }));
      setEditing(false);
      toast.success('Profile updated successfully!');
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  // ── Loading / auth guard ──────────────────────────────────────────────────────

  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="font-heading text-lg text-brand-dark">Please log in to view your profile</p>
      </div>
    );
  }

  if (status === 'loading' && !profile) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-brand-muted">
        <Loader2 size={20} className="animate-spin text-brand-orange" />
        <span className="text-sm">Loading profile…</span>
      </div>
    );
  }

  if (!profile) return null;

  // ── Derived values ─────────────────────────────────────────────────────────────

  const xpInfo        = getLevelProgress(profile.reputation_score);
  const unlockedCount = profile.achievements.filter(a => a.unlockedAt !== null).length;
  const totalXp       = profile.achievements.filter(a => a.unlockedAt !== null).reduce((s, a) => s + a.xp, 0);
  const filteredAch   = profile.achievements.filter(a =>
    achFilter === 'unlocked' ? a.unlockedAt !== null :
    achFilter === 'locked'   ? a.unlockedAt === null : true
  );

  const TABS = [
    { id: 'info'         as Tab, label: 'Personal Info',                                              icon: <Edit3 size={15} /> },
    { id: 'achievements' as Tab, label: `Achievements (${unlockedCount}/${profile.achievements.length})`, icon: <Trophy size={15} /> },
    { id: 'activity'     as Tab, label: 'Activity',                                                   icon: <Calendar size={15} /> },
  ];

  const labelMap: Record<string, string> = {
    name: "Họ tên",
    age: "Tuổi",
    gender: "Giới tính",
    location: "Địa chỉ",
    skill_level: "Trình độ",
    reputation_score: "Điểm uy tín",
    is_verified: "Xác minh",
    joinedAt: "Ngày tham gia",
  };

  const ROLE_BADGE = { user: 'bg-[#d0f5ee] text-[#00785e]', owner: 'bg-[#ddeeff] text-brand-navy', admin: 'bg-[#ffd6d6] text-brand-red' };
  const ROLE_LABEL = { user: 'Người chơi', owner: 'Chủ sân', admin: 'Admin' };

  return (
    <div className="flex flex-col min-h-full bg-brand-surface">
      {/* Cover */}
      <div className="relative w-full overflow-hidden h-[220px]">
        <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(36,25,20,0.65))' }} />
        <button className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[13px] border border-white/25 bg-white/15 backdrop-blur-sm">
          <Camera size={14} /> Change Cover
        </button>
        {/* Subtle refresh indicator when revalidating cached data */}
        {status === 'loading' && profile && (
          <div className="absolute top-4 left-4">
            <Loader2 size={16} className="animate-spin text-white/70" />
          </div>
        )}
      </div>

      <div className="max-w-screen-lg mx-auto w-full px-6">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 mb-6 relative z-10">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-brand-surface"
              style={{ boxShadow: '0 4px 16px rgba(36,25,20,0.2)' }}>
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover bg-brand-surface-warm" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center bg-brand-orange border-2 border-brand-surface">
              <Camera size={12} className="text-white" />
            </button>
          </div>

          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl font-extrabold text-brand-dark">{profile.name}</h1>
              {profile.is_verified && <BadgeCheck size={20} className="text-brand-teal" />}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ROLE_BADGE[authUser.role]}`}>
                {ROLE_LABEL[authUser.role]}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1.5">
              {profile.location && (
                <span className="flex items-center gap-1 text-[13px] text-brand-body">
                  <MapPin size={13} className="text-brand-orange" /> {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-[13px] text-brand-body">
                <Calendar size={13} className="text-brand-orange" /> Joined {formatDate(profile.joinedAt)}
              </span>
              <span className="flex items-center gap-1 text-[13px] text-brand-body">
                <Star size={13} fill="#a04100" className="text-brand-orange" /> {profile.rating} ({profile.reviewCount} reviews)
              </span>
            </div>
          </div>

          <button onClick={() => { setTab('info'); setEditing(true); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl gradient-orange text-white text-[13px] font-bold font-heading hover:opacity-90 transition-opacity shrink-0">
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '🏸', label: 'Sport',         value: profile.sport_preference.slice(0, 2).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') || '–' },
            { icon: '⚡', label: 'Skill Level',    value: profile.skill_level.charAt(0).toUpperCase() + profile.skill_level.slice(1) },
            { icon: '📅', label: 'Total Bookings', value: `${profile.totalBookings}` },
            { icon: '🤝', label: 'Matches Played', value: `${profile.totalMatchesPlayed}` },
          ].map((s, i) => (
            <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3 bg-white border border-brand-border">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-sm font-bold text-brand-dark font-heading">{s.value}</p>
                <p className="text-[11px] text-brand-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div> */}

        {/* Level / reputation bar */}
        {/* <div className="rounded-2xl p-5 mb-6 flex items-center gap-5 bg-white border border-brand-border">
          <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 gradient-orange"
            style={{ boxShadow: '0 4px 12px rgba(160,65,0,0.35)' }}>
            <span className="font-heading text-lg font-black text-white leading-none">{xpInfo.level}</span>
            <span className="text-[9px] text-white/80 tracking-widest">LEVEL</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-sm font-bold text-brand-dark">
                Level {xpInfo.level}
                {xpInfo.level < 50 && <span className="text-[13px] font-normal text-brand-muted"> → {xpInfo.level + 1}</span>}
              </span>
              <span className="text-[13px] text-brand-orange font-semibold">{profile.reputation_score} rep</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-brand-surface-warm">
              <div className="h-full rounded-full gradient-orange transition-[width] duration-500" style={{ width: `${xpInfo.pct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-brand-muted">{unlockedCount} achievements · {totalXp} XP</span>
              <span className="text-[11px] text-brand-orange font-semibold">{xpInfo.pct}%</span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-brand-orange" />
              <span className="font-heading text-[15px] font-bold text-brand-orange">{unlockedCount}/{profile.achievements.length}</span>
            </div>
            <span className="text-[11px] text-brand-muted">Achievements</span>
          </div>
        </div> */}

        {/* Tabs */}
        <div className="flex border-b border-brand-border mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setEditing(false); }}
              className={`flex items-center gap-2 px-4 py-3 transition-colors text-sm -mb-px border-b-2
                ${tab === t.id ? 'font-bold text-brand-orange border-brand-orange' : 'font-normal text-brand-body border-transparent hover:text-brand-orange'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Personal Info Tab ── */}
        {tab === 'info' && (
          <div className="pb-12">
            {editing ? (
              <div className="rounded-2xl p-6 bg-white border border-brand-border">
                <h2 className="font-heading text-lg font-bold text-brand-dark mb-5">Edit Profile</h2>
                <EditForm profile={profile} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 flex flex-col gap-5">
                  <div className="rounded-2xl p-5 bg-white border border-brand-border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading text-base font-bold text-brand-dark">Personal Details</h3>
                      <button onClick={() => setEditing(true)}
                        className="flex items-center gap-1 px-3 h-8 rounded-lg hover:bg-brand-surface-orange transition-colors text-[13px] text-brand-orange font-semibold">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                    {[
                      { label: "name", value: profile.name },
                      {
                        label: "age",
                        value: profile.age ? `${profile.age} tuổi` : "—",
                      },
                      {
                        label: "gender",
                        value:
                          profile.gender === "prefer_not_to_say"
                            ? "Không muốn tiết lộ"
                            : profile.gender?.charAt(0).toUpperCase() +
                                profile.gender?.slice(1) || "—",
                      },
                      {
                        label: "location",
                        value: profile.location || "—",
                      },
                      {
                        label: "skill_level",
                        value:
                          profile.skill_level?.charAt(0).toUpperCase() +
                            profile.skill_level?.slice(1) || "—",
                      },
                      {
                        label: "reputation_score",
                        value: `${profile.reputation_score} điểm`,
                      },
                      {
                        label: "is_verified",
                        value: profile.is_verified
                          ? <div className='flex items-center gap-2 text-teal-500'><Verified /> Đã xác minh</div>
                          : <div className='flex items-center gap-2 text-red-500'><X /> Chưa xác minh</div>,
                      },
                      {
                        label: "joinedAt",
                        value: formatDate(profile.joinedAt),
                      },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="font-mono text-sm text-brand-muted mb-1">
                          {labelMap[item.label]}
                        </p>
                        <p className="text-sm font-semibold text-brand-dark">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  </div>

                  <div className="rounded-2xl p-5 bg-white border border-brand-border">
                    <h3 className="font-heading text-base font-bold text-brand-dark mb-3">Performance</h3>
                    {[
                      { label: 'Court Bookings',   value: profile.totalBookings,      icon: '📅' },
                      { label: 'Matches Played',   value: profile.totalMatchesPlayed, icon: '🤝' },
                      { label: 'Community Rating', value: `${profile.rating} ⭐`,     icon: '🌟' },
                      { label: 'Reviews Received', value: profile.reviewCount,        icon: '💬' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between py-2.5 text-[13px] ${i > 0 ? 'border-t border-brand-surface-warm' : ''}`}>
                        <span className="text-brand-body">{item.icon} {item.label}</span>
                        <span className="font-heading text-[15px] font-bold text-brand-dark">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl p-5 bg-white border border-brand-border">
                    <h3 className="font-heading text-base font-bold text-brand-dark mb-1">Sport Preferences</h3>
                    <p className="font-mono text-[11px] text-brand-muted mb-3">sport_preference</p>
                    {profile.sport_preference.length === 0 ? (
                      <p className="text-[13px] text-brand-muted italic">No sports added yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profile.sport_preference.map(s => {
                          const info = SPORTS.find(x => x.value === s);
                          return (
                            <span key={s} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-surface-orange border-[1.5px] border-brand-orange/20 text-[13px] text-brand-orange font-semibold">
                              {info?.emoji} {info?.label ?? s}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl p-5 bg-white border border-brand-border">
                    <h3 className="font-heading text-base font-bold text-brand-dark mb-3">Account</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="font-mono text-[11px] text-brand-muted mb-0.5">email</p>
                        <p className="text-sm font-semibold text-brand-dark">{authUser.email}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[11px] text-brand-muted mb-0.5">status</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-bold
                          ${authUser.status === 'active'  ? 'bg-[#d0f5ee] text-[#00785e]' :
                            authUser.status === 'warning' ? 'bg-[#fff3cd] text-[#856404]' : 'bg-[#ffd6d6] text-brand-red'}`}>
                          {authUser.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Achievements Tab ── */}
        {tab === 'achievements' && (
          <div className="pb-12">
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-surface-orange border border-brand-orange/15">
                <Trophy size={18} className="text-brand-orange" />
                <div>
                  <p className="font-heading text-base font-extrabold text-brand-orange leading-none">{unlockedCount}/{profile.achievements.length}</p>
                  <p className="text-[11px] text-brand-muted">Unlocked</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-surface-orange border border-brand-orange/15">
                <Zap size={18} className="text-brand-orange" />
                <div>
                  <p className="font-heading text-base font-extrabold text-brand-orange leading-none">{totalXp} XP</p>
                  <p className="text-[11px] text-brand-muted">From achievements</p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                {(['all', 'unlocked', 'locked'] as const).map(f => (
                  <button key={f} onClick={() => setAchFilter(f)}
                    className={`px-3 h-9 rounded-xl capitalize text-[13px] transition-all border-[1.5px]
                      ${achFilter === f ? 'bg-brand-orange border-brand-orange text-white font-bold' : 'bg-white border-brand-border text-brand-body hover:bg-brand-surface-orange'}`}>
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

        {/* ── Activity Tab ── */}
        {tab === 'activity' && (
          <div className="pb-12">
            {profile.recentActivity.length === 0 ? (
              <div className="text-center py-16">
                <Calendar size={48} className="text-brand-border mx-auto mb-3" />
                <p className="text-[15px] text-brand-muted">No activity yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {profile.recentActivity.map(item => {
                  const TYPE_COLOR: Record<string, string> = { booking: 'text-brand-orange', match: 'text-brand-teal', message: 'text-brand-navy', achievement: 'text-[#856404]' };
                  const TYPE_BG:    Record<string, string> = { booking: 'bg-brand-surface-orange', match: 'bg-brand-surface-teal', message: 'bg-[#ddeeff]', achievement: 'bg-[#fff3cd]' };
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white border border-brand-border">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${TYPE_BG[item.type]}`}>{item.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
                        <p className="text-xs text-brand-muted mt-0.5">{item.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize bg-white border border-brand-border ${TYPE_COLOR[item.type]}`}>
                          {item.type}
                        </span>
                        <span className="text-[11px] text-brand-muted">{formatDate(item.date)}</span>
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
