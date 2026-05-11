import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router';
import { Bell, LogIn, ChevronDown, LogOut, User, Building2, ShieldCheck } from 'lucide-react';
import { MatchingFAB } from '../../features/matching/components/MatchingFAB';
import { getCurrentUser, subscribeAuth, logout } from '../../features/auth/store/authStore';
import { toast } from 'sonner';

const NAV_LINKS = [
  { label: 'Home',        to: '/discover' },
  { label: 'Feed',        to: '/feed' },
  { label: 'Venues',      to: '/venues' },
  { label: 'My Bookings', to: '/bookings' },
  { label: 'Community',   to: '/messages' },
];

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  player: { bg: '#d0f5ee', color: '#00785e', label: 'Người chơi' },
  owner:  { bg: '#ddeeff', color: '#1a5fb4', label: 'Chủ sân' },
  admin:  { bg: '#ffd6d6', color: '#c0392b', label: 'Admin' },
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => subscribeAuth(() => setUser(getCurrentUser())), []);

  const isActive = (to: string) => {
    if (to === '/discover') return pathname === '/discover' || pathname === '/';
    if (to === '/venues')   return pathname.startsWith('/venues');
    return pathname.startsWith(to);
  };

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/auth/login');
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fff8f6' }}>
      <header
        className="sticky top-0 z-20 bg-[#fff8f6] border-b border-[#dfc0b3]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-screen-xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              to="/discover"
              style={{ fontFamily: 'Lexend, sans-serif', fontSize: '22px', fontWeight: 800, color: '#a04100', textDecoration: 'none' }}
            >
              Matchill
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative pb-1.5 transition-colors"
                  style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '15px',
                    fontWeight: isActive(link.to) ? 700 : 400,
                    color: isActive(link.to) ? '#a04100' : '#584238',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <span
                      className="absolute bottom-0 left-0 right-0 rounded-full"
                      style={{ height: '2px', background: '#a04100' }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-[#fff1eb] transition-colors" style={{ color: '#584238' }}>
              <Bell size={18} />
            </button>

            {/* User menu */}
            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#fff1eb] transition-colors"
                  style={{ border: '1.5px solid #dfc0b3' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)', color: '#fff', fontFamily: 'Lexend, sans-serif' }}
                  >
                    {user.name[0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '13px', fontWeight: 700, color: '#241914', lineHeight: 1.1 }}>
                      {user.name.split(' ')[0]}
                    </p>
                  </div>
                  <ChevronDown size={13} style={{ color: '#8b7266' }} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-2 z-30 rounded-2xl overflow-hidden"
                      style={{ background: '#fff', border: '1.5px solid #dfc0b3', width: 230, boxShadow: '0 12px 36px rgba(36,25,20,0.18)' }}
                    >
                      {/* User info */}
                      <div className="px-4 py-4 border-b border-[#f4ded5]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#a04100,#ff7e36)', color: '#fff', fontFamily: 'Lexend, sans-serif', fontSize: '16px', fontWeight: 700 }}
                          >
                            {user.name[0]}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Lexend, sans-serif', fontSize: '14px', fontWeight: 700, color: '#241914' }}>{user.name}</p>
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                background: ROLE_BADGE[user.role].bg,
                                color: ROLE_BADGE[user.role].color,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {ROLE_BADGE[user.role].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="px-2 py-2">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#fff1eb] transition-colors"
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#241914', textDecoration: 'none' }}
                        >
                          <User size={16} style={{ color: '#a04100' }} /> My Profile
                        </Link>

                        {user.role === 'owner' && (
                          <Link
                            to="/owner/venues"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ddeeff] transition-colors"
                            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1a5fb4', textDecoration: 'none' }}
                          >
                            <Building2 size={16} /> Owner Dashboard
                          </Link>
                        )}

                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffd6d6] transition-colors"
                            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#c0392b', textDecoration: 'none' }}
                          >
                            <ShieldCheck size={16} /> Admin Panel
                          </Link>
                        )}
                      </div>

                      <div className="px-2 pb-2 border-t border-[#f4ded5] pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffeeee] transition-colors"
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ba1a1a', fontWeight: 500 }}
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 ml-2 h-9 px-4 rounded-xl hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg,#a04100,#ff7e36)',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <LogIn size={14} /> Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <MatchingFAB />
    </div>
  );
}