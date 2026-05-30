import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router';
import { Bell, LogIn, ChevronDown, LogOut, User, Building2, ShieldCheck } from 'lucide-react';
import { MatchingFAB } from '../../features/matching/components/MatchingFAB';
import { logout } from '../../features/auth/store/authSlice';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const NAV_LINKS = [
  { key: 'nav.home',       to: '/discover' },
  { key: 'nav.feed',       to: '/feed' },
  { key: 'nav.venues',     to: '/venues' },
  { key: 'nav.bookings',   to: '/bookings' },
  { key: 'nav.messages',   to: '/messages' },
];

const ROLE_BADGE = {
  user:  { bg: 'bg-[#d0f5ee] text-[#00785e]', key: 'roles.user' },
  owner: { bg: 'bg-[#ddeeff] text-brand-navy',  key: 'roles.owner' },
  admin: { bg: 'bg-[#ffd6d6] text-brand-red',   key: 'roles.admin' },
};

export default function AppLayout() {
  const { t } = useTranslation('matching');
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const dispatch     = useAppDispatch();
  const user         = useAppSelector(state => state.auth.user);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (to: string) => {
    if (to === '/discover') return pathname === '/discover' || pathname === '/';
    if (to === '/venues')   return pathname.startsWith('/venues');
    return pathname.startsWith(to);
  };

  const handleLogout = () => {
    dispatch(logout()); // also auto-clears profile via profileSlice extraReducers
    toast.success(t('layout.logoutSuccess'));
    navigate('/login');
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface">
      <header className="sticky top-0 z-20 bg-brand-surface border-b border-brand-border shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/discover" className="font-heading text-md font-extrabold text-brand-orange no-underline">
              <img src="/logo.png" alt="Logo" className="w-14 h-14 inline-block object-contain" />
              Matchill
            </Link>
            <nav className="hidden md:flex items-center gap-5 lg:gap-7">
              {NAV_LINKS.map(link => (
                <Link key={link.to} to={link.to}
                  className={`relative pb-1.5 transition-colors no-underline font-heading text-[15px]
                    ${isActive(link.to) ? 'font-bold text-brand-orange' : 'font-normal text-brand-body'}`}>
                  {t(link.key)}
                  {isActive(link.to) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-orange" />
                  )}
                </Link>
              ))}
              <MatchingFAB />
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="hidden sm:flex mr-2" />
            <button className="p-2 rounded-full hover:bg-brand-surface-orange transition-colors text-brand-body">
              <Bell size={18} />
            </button>

            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-brand-surface-orange transition-colors border-[1.5px] border-brand-border"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white gradient-orange-diag font-heading">
                    { user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" /> : user.name[0]}
                  </div>
                  <p className="hidden sm:block text-[13px] font-bold text-brand-dark font-heading leading-tight">
                    {user.name.split(' ')[0]}
                  </p>
                  <ChevronDown size={13} className="text-brand-muted" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-30 rounded-2xl overflow-hidden bg-white border-[1.5px] border-brand-border w-[230px] shadow-2xl">
                      <div className="px-4 py-4 border-b border-brand-surface-warm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white gradient-orange-diag font-heading">
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" /> : user.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-dark font-heading">{user.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[user.role].bg}`}>
                              {t(ROLE_BADGE[user.role].key)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-2">
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline">
                          <User size={16} className="text-brand-orange" /> {t('layout.profile')}
                        </Link>
                        {user.role === 'owner' && (
                          <Link to="/owner/venues" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ddeeff] transition-colors text-sm text-brand-navy no-underline">
                            <Building2 size={16} /> {t('layout.ownerDashboard')}
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffd6d6] transition-colors text-sm text-brand-red no-underline">
                            <ShieldCheck size={16} /> {t('layout.adminPanel')}
                          </Link>
                        )}
                      </div>

                      <div className="px-2 pb-2 border-t border-brand-surface-warm pt-2">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffeeee] transition-colors text-sm text-[#ba1a1a] font-medium">
                          <LogOut size={16} /> {t('layout.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="flex items-center gap-1.5 ml-2 h-9 px-4 rounded-xl hover:opacity-90 transition-opacity gradient-orange text-sm font-bold text-white no-underline font-heading">
                <LogIn size={14} /> {t('layout.login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
