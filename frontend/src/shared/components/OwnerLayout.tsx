import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Building2, CalendarDays, BarChart3,
  LogOut, Bell, ChevronRight, Menu, X, Settings
} from 'lucide-react';
import { getCurrentUser, subscribeAuth, logout } from '../../features/auth/store/authStore';
import { toast } from 'sonner';

const NAV = [
  { to: '/owner/venues', icon: <Building2 size={18} />, label: 'My Venues' },
  { to: '/owner/bookings', icon: <CalendarDays size={18} />, label: 'All Bookings' },
  { to: '/owner/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { to: '/owner/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export default function OwnerLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    return subscribeAuth(() => setUser(getCurrentUser()));
  }, []);

  // Redirect if not owner
  useEffect(() => {
    if (!user || user.role !== 'owner') {
      navigate('/auth/login');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/auth/login');
  };

  const isActive = (to: string) => pathname.startsWith(to);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#dfc0b3]">
        <Link
          to="/owner/venues"
          style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: '20px',
            fontWeight: 800,
            color: '#a04100',
            textDecoration: 'none',
          }}
        >
          Matchill
        </Link>
        <span
          className="px-2 py-0.5 rounded-md"
          style={{
            background: '#ddeeff',
            color: '#1a5fb4',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          Chủ sân
        </span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-4 mx-3 mt-4 mb-2 rounded-xl" style={{ background: '#fff1eb' }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)', color: '#fff', fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700 }}
        >
          {user?.name?.[0] ?? 'O'}
        </div>
        <div className="min-w-0">
          <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#241914' }}>
            {user?.name}
          </p>
          <p className="truncate" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8b7266' }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV.map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: active ? '#a04100' : 'transparent',
                color: active ? '#fff' : '#584238',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 flex flex-col gap-2">
        <Link
          to="/discover"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#fff1eb]"
          style={{ color: '#8b7266', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
        >
          <LayoutDashboard size={18} />
          Player View
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#ffeeee] w-full"
          style={{ color: '#ba1a1a', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#fff8f6' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: '#fff', borderRight: '1px solid #dfc0b3' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(36,25,20,0.4)' }} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col overflow-y-auto"
            style={{ background: '#fff', borderRight: '1px solid #dfc0b3' }}
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center px-6 h-[60px] gap-4"
          style={{ background: '#fff', borderBottom: '1px solid #dfc0b3', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#fff1eb] transition-colors"
            style={{ color: '#584238' }}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button
            className="p-2 rounded-full hover:bg-[#fff1eb] transition-colors"
            style={{ color: '#584238' }}
          >
            <Bell size={18} />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)', color: '#fff', fontFamily: 'Lexend, sans-serif', fontSize: '13px', fontWeight: 700 }}
          >
            {user?.name?.[0] ?? 'O'}
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
