import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  MessageSquare,
  LogOut,
  Bell,
  Menu,
  ChevronRight,
  ChevronDown,
  User,
} from "lucide-react";
import { logout } from "../../features/auth/store/authSlice";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

const NAV = [
  { to: "/admin", exact: true, icon: <LayoutDashboard size={18} />, key: "admin.nav.overview" },
  { to: "/admin/statistics", exact: false, icon: <BarChart3 size={18} />, key: "admin.nav.statistics" },
  { to: "/admin/wallet", exact: false, icon: <Wallet size={18} />, key: "admin.nav.wallet" },
  { to: "/admin/feedback", exact: false, icon: <MessageSquare size={18} />, key: "admin.nav.feedback" },
];

export default function AdminLayout() {
  const { t } = useTranslation("matching");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/login");
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success(t("layout.logoutSuccess"));
    navigate("/login");
    setUserMenuOpen(false);
  };
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-border">
        <Link
          to="/admin"
          className="font-heading text-xl font-extrabold text-brand-orange no-underline"
        >
          Matchill
        </Link>
        <span className="px-2 py-0.5 rounded-md bg-[#ffd6d6] text-brand-red text-[11px] font-bold">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-4 mx-3 mt-4 mb-2 rounded-xl bg-brand-surface-orange">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 gradient-red-diag text-sm font-bold text-white font-heading">
          {user?.name?.[0] ?? "A"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-dark font-heading">{user?.name}</p>
          <p className="text-xs text-brand-muted truncate">Super Administrator</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all no-underline text-sm
                ${active ? "bg-brand-red text-white font-semibold" : "text-brand-body font-normal hover:bg-brand-surface-orange"}`}
            >
              <span className={active ? "opacity-100" : "opacity-70"}>{item.icon}</span>
              {t(item.key)}
              {active && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 flex flex-col gap-2">
        <Link
          to="/discover"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-brand-muted no-underline text-sm"
        >
          <LayoutDashboard size={18} /> {t("admin.playerView")}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffeeee] w-full transition-colors text-[#ba1a1a] text-sm font-medium"
        >
          <LogOut size={18} /> {t("layout.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-brand-surface">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white border-r border-brand-border">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-brand-dark/40" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col overflow-y-auto bg-white border-r border-brand-border"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center px-6 h-[60px] gap-4 bg-white border-b border-brand-border shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-brand-surface-orange text-brand-body"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <LanguageSwitcher className="mr-1" />
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-brand-surface-orange transition-colors border-[1.5px] border-brand-border"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white gradient-red-diag font-heading">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    user.name[0]
                  )}
                </div>
                <p className="hidden sm:block text-[13px] font-bold text-brand-dark font-heading leading-tight">
                  {user.name.split(" ")[0]}
                </p>
                <ChevronDown size={13} className="text-brand-muted" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-30 w-[230px] overflow-hidden rounded-2xl border-[1.5px] border-brand-border bg-white shadow-2xl">
                    <div className="px-4 py-4 border-b border-brand-surface-warm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white gradient-red-diag font-heading">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            user.name[0]
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-dark font-heading">{user.name}</p>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffd6d6] text-brand-red">
                            {t("roles.admin")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-2">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline"
                      >
                        <User size={16} className="text-brand-red" /> {t("layout.profile")}
                      </Link>
                      <Link
                        to="/admin/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline"
                      >
                        <Wallet size={16} className="text-brand-red" /> {t("admin.nav.wallet")}
                      </Link>
                      <Link
                        to="/admin/feedback"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline"
                      >
                        <MessageSquare size={16} className="text-brand-red" /> {t("admin.nav.feedback")}
                      </Link>
                      <Link
                        to="/discover"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline"
                      >
                        <LayoutDashboard size={16} className="text-brand-red" /> {t("admin.playerView")}
                      </Link>
                    </div>

                    <div className="px-2 pb-2 border-t border-brand-surface-warm pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffeeee] transition-colors text-sm text-[#ba1a1a] font-medium"
                      >
                        <LogOut size={16} /> {t("layout.logout")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            title={t("admin.layout.notifications")}
            className="p-2 rounded-full hover:bg-brand-surface-orange transition-colors text-brand-body"
          >
            <Bell size={18} />
          </button>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
