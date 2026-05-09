import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Users, ShieldCheck, ShieldX,
  MoreVertical, Trash2, UserCog, Shield,
  AlertTriangle, CheckCircle2, Clock,
  Loader2, Building2, DollarSign, XCircle,
  Flag, RefreshCw, Filter
} from 'lucide-react';
import {
  getAdminUsers, getAdminStats, updateUserRole, updateUserStatus,
  deleteUser, subscribeAdmin, type AdminUser, type UserStatus
} from '../store/adminStore';
import type { UserRole } from '../../auth/store/authStore';
import { toast } from 'sonner';

function formatPrice(n: number) { return new Intl.NumberFormat('vi-VN').format(n) + '₫'; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

const ROLE_STYLE: Record<UserRole, { bg: string; color: string; label: string }> = {
  player:  { bg: '#d0f5ee', color: '#00785e', label: 'Người chơi' },
  owner:   { bg: '#ddeeff', color: '#1a5fb4', label: 'Chủ sân' },
  admin:   { bg: '#ffd6d6', color: '#c0392b', label: 'Admin' },
};

const STATUS_STYLE: Record<UserStatus, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  active:               { bg: '#e7f8f7', color: '#006a65', label: 'Active', icon: <CheckCircle2 size={11} /> },
  suspended:            { bg: '#ffd6d6', color: '#c0392b', label: 'Suspended', icon: <XCircle size={11} /> },
  pending_verification: { bg: '#fff3cd', color: '#856404', label: 'Pending', icon: <Clock size={11} /> },
};

const SPORT_EMOJI: Record<string, string> = {
  tennis: '🎾', basketball: '🏀', badminton: '🏸',
  football: '⚽', pickleball: '🏓', volleyball: '🏐',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${color}22` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '22', color }}>
        {icon}
      </div>
      <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '26px', fontWeight: 800, color: '#241914', lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238', marginTop: 3 }}>{label}</p>
      {sub && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color, marginTop: 2, fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────
function ActionMenu({ user, onClose, onAction }: {
  user: AdminUser;
  onClose: () => void;
  onAction: (action: string, user: AdminUser) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute right-0 top-8 z-40 rounded-xl overflow-hidden shadow-xl"
        style={{ background: '#fff', border: '1.5px solid #dfc0b3', width: 210, boxShadow: '0 8px 24px rgba(36,25,20,0.2)' }}
      >
        <div className="px-4 py-2.5 border-b border-[#f4ded5]">
          <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '13px', fontWeight: 700, color: '#241914' }}>
            {user.name}
          </p>
        </div>
        {/* Role change */}
        <div className="px-3 py-2 border-b border-[#f4ded5]">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginBottom: 4, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Change Role</p>
          {(['player', 'owner', 'admin'] as UserRole[]).filter(r => r !== user.role).map(role => (
            <button
              key={role}
              onClick={() => { onAction(`role:${role}`, user); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#fff1eb] transition-colors text-left"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: ROLE_STYLE[role].color }}
            >
              <UserCog size={14} /> Set as {ROLE_STYLE[role].label}
            </button>
          ))}
        </div>
        {/* Status change */}
        <div className="px-3 py-2 border-b border-[#f4ded5]">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8b7266', marginBottom: 4, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</p>
          {user.status !== 'active' && (
            <button
              onClick={() => { onAction('status:active', user); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#e7f8f7] transition-colors text-left"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#006a65' }}
            >
              <ShieldCheck size={14} /> Activate
            </button>
          )}
          {user.status !== 'suspended' && (
            <button
              onClick={() => { onAction('status:suspended', user); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ffeeee] transition-colors text-left"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b' }}
            >
              <ShieldX size={14} /> Suspend
            </button>
          )}
        </div>
        {/* Delete */}
        {user.role !== 'admin' && (
          <div className="px-3 py-2">
            <button
              onClick={() => { onAction('delete', user); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ffeeee] transition-colors text-left"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b', fontWeight: 600 }}
            >
              <Trash2 size={14} /> Delete User
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, onAction }: { user: AdminUser; onAction: (action: string, user: AdminUser) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rs = ROLE_STYLE[user.role];
  const ss = STATUS_STYLE[user.status];

  return (
    <tr className="border-b border-[#f4ded5] hover:bg-[#fffaf8] transition-colors">
      {/* User */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-xl object-cover" style={{ background: '#f4ded5' }} />
            {user.isFlagged && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#c0392b' }}>
                <Flag size={8} color="#fff" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#241914' }}>
                {user.name}
              </p>
              {user.role === 'admin' && <Shield size={13} style={{ color: '#c0392b' }} />}
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{user.email}</p>
          </div>
        </div>
      </td>
      {/* Role */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{ background: rs.bg, color: rs.color, fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}
        >
          {rs.label}
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{ background: ss.bg, color: ss.color, fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}
        >
          {ss.icon} {ss.label}
        </span>
      </td>
      {/* City */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#584238' }}>{user.city}</span>
      </td>
      {/* Sports */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex gap-1 flex-wrap">
          {user.sportPreferences.slice(0, 3).map(s => (
            <span key={s} title={s}>{SPORT_EMOJI[s] ?? '🏅'}</span>
          ))}
          {user.sportPreferences.length === 0 && <span style={{ color: '#8b7266', fontSize: '12px' }}>–</span>}
        </div>
      </td>
      {/* Joined */}
      <td className="px-4 py-3 hidden xl:table-cell">
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{formatDate(user.joinedAt)}</span>
      </td>
      {/* Last active */}
      <td className="px-4 py-3 hidden xl:table-cell">
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>{timeAgo(user.lastActiveAt)}</span>
      </td>
      {/* Bookings */}
      <td className="px-4 py-3 hidden md:table-cell text-right">
        <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '13px', fontWeight: 700, color: '#241914' }}>
          {user.totalBookings}
        </span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative flex justify-end">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#fff1eb] transition-colors"
            style={{ color: '#584238' }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && <ActionMenu user={user} onClose={() => setMenuOpen(false)} onAction={onAction} />}
        </div>
      </td>
    </tr>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ user, onConfirm, onCancel }: {
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    onConfirm();
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(36,25,20,0.5)' }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full" style={{ boxShadow: '0 24px 64px rgba(36,25,20,0.3)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#ffd6d6' }}>
          <Trash2 size={22} style={{ color: '#c0392b' }} />
        </div>
        <h3 className="text-center" style={{ fontFamily: 'Lexend, sans-serif', fontSize: '18px', fontWeight: 700, color: '#241914', marginBottom: 8 }}>
          Delete User?
        </h3>
        <p className="text-center" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginBottom: 20 }}>
          Are you sure you want to permanently delete <strong>{user.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl hover:bg-[#fff1eb] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', border: '1.5px solid #dfc0b3' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2"
            style={{ background: '#c0392b', fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#fff', border: 'none' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>(() => getAdminUsers());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actLoading, setActLoading] = useState<string | null>(null);
  const stats = getAdminStats();

  const refresh = useCallback(() => setUsers(getAdminUsers()), []);
  useEffect(() => { refresh(); return subscribeAdmin(refresh); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const flaggedUsers = users.filter(u => u.isFlagged);

  const handleAction = async (action: string, user: AdminUser) => {
    if (action === 'delete') { setDeleteTarget(user); return; }

    setActLoading(user.id);
    await new Promise(r => setTimeout(r, 500));

    if (action.startsWith('role:')) {
      const role = action.split(':')[1] as UserRole;
      updateUserRole(user.id, role);
      toast.success(`${user.name} → ${ROLE_STYLE[role].label}`);
    } else if (action.startsWith('status:')) {
      const status = action.split(':')[1] as UserStatus;
      updateUserStatus(user.id, status);
      toast.success(`${user.name} → ${STATUS_STYLE[status].label}`);
    }
    setActLoading(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    toast.success(`${deleteTarget.name} has been deleted`);
    setDeleteTarget(null);
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
    <div className="px-6 py-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '28px', fontWeight: 700, color: '#241914' }}>
          Administration Panel
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#584238', marginTop: 4 }}>
          Manage users, roles, and platform health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={<Users size={20} />} label="Total Users" value={stats.totalUsers} color="#241914" bg="#fff" sub={`+3 this week`} />
        <StatCard icon={<CheckCircle2 size={20} />} label="Active" value={stats.activeUsers} color="#006a65" bg="#e7f8f7" />
        <StatCard icon={<XCircle size={20} />} label="Suspended" value={stats.suspendedUsers} color="#c0392b" bg="#ffd6d6" />
        <StatCard icon={<Clock size={20} />} label="Pending" value={stats.pendingVerification} color="#856404" bg="#fff3cd" />
        <StatCard icon={<Building2 size={20} />} label="Owners" value={stats.totalOwners} color="#1a5fb4" bg="#ddeeff" sub={`${stats.totalOwners} venues`} />
        <StatCard icon={<DollarSign size={20} />} label="Revenue" value={formatPrice(stats.totalRevenue).replace('₫', '')} color="#a04100" bg="#fff1eb" sub="₫ total platform" />
      </div>

      {/* Flagged users alert */}
      {flaggedUsers.length > 0 && (
        <div className="flex items-start gap-4 p-4 rounded-2xl mb-6" style={{ background: '#ffd6d6', border: '1.5px solid rgba(192,57,43,0.25)' }}>
          <AlertTriangle size={20} style={{ color: '#c0392b', flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '15px', fontWeight: 700, color: '#c0392b' }}>
              {flaggedUsers.length} Flagged User{flaggedUsers.length > 1 ? 's' : ''} Require Attention
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {flaggedUsers.map(u => (
                <span
                  key={u.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c0392b' }}
                >
                  <Flag size={11} />
                  {u.name}
                  <span style={{ color: '#8b7266', fontSize: '11px' }}>— {u.flagReason}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #dfc0b3', boxShadow: '0 2px 8px rgba(36,25,20,0.07)' }}>
        {/* Table header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#dfc0b3] flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={18} style={{ color: '#a04100' }} />
            <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700, color: '#241914' }}>
              User Management
            </h2>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ background: '#fff1eb', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#a04100' }}
            >
              {filtered.length}
            </span>
          </div>

          <div className="flex-1 flex items-center gap-3 flex-wrap ml-auto justify-end">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8b7266' }} />
              <input
                type="text"
                placeholder="Search name, email, city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...selectStyle, paddingLeft: '32px', width: 220 }}
                onFocus={e => { e.target.style.borderColor = '#006a65'; }}
                onBlur={e => { e.target.style.borderColor = '#dfc0b3'; }}
              />
            </div>

            <Filter size={14} style={{ color: '#8b7266' }} />
            {/* Role filter */}
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} style={selectStyle}>
              <option value="all">All Roles</option>
              <option value="player">Người chơi</option>
              <option value="owner">Chủ sân</option>
              <option value="admin">Admin</option>
            </select>

            {/* Status filter */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={selectStyle}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending</option>
            </select>

            <button
              onClick={refresh}
              className="p-2 rounded-lg hover:bg-[#fff1eb] transition-colors"
              style={{ color: '#584238' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#fffaf8' }}>
                {[
                  { label: 'User', cl: 'px-4 py-3' },
                  { label: 'Role', cl: 'px-4 py-3' },
                  { label: 'Status', cl: 'px-4 py-3' },
                  { label: 'City', cl: 'px-4 py-3 hidden md:table-cell' },
                  { label: 'Sports', cl: 'px-4 py-3 hidden lg:table-cell' },
                  { label: 'Joined', cl: 'px-4 py-3 hidden xl:table-cell' },
                  { label: 'Last Active', cl: 'px-4 py-3 hidden xl:table-cell' },
                  { label: 'Bookings', cl: 'px-4 py-3 hidden md:table-cell text-right' },
                  { label: '', cl: 'px-4 py-3' },
                ].map((h, i) => (
                  <th
                    key={i}
                    className={h.cl}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#8b7266', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Users size={40} style={{ color: '#dfc0b3', margin: '0 auto 12px' }} />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8b7266' }}>No users found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <UserRow key={user.id} user={user} onAction={handleAction} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#f4ded5]">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8b7266' }}>
            Showing {filtered.length} of {users.length} users
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {(['player', 'owner', 'admin'] as UserRole[]).map(role => (
                <span key={role} className="flex items-center gap-1.5" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#584238' }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: ROLE_STYLE[role].color }} />
                  {ROLE_STYLE[role].label}: {users.filter(u => u.role === role).length}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}