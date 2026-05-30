import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BarChart3,
  LogOut,
  Bell,
  ChevronRight,
  Menu,
  Settings,
} from "lucide-react";
import { logout } from "../../features/auth/store/authSlice";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

const NAV = [
  { to: "/owner/venues", icon: <Building2 size={18} />, key: "owner.nav.venues" },

];

export default function OwnerLayout() {
  const { t } = useTranslation("matching");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "owner") navigate("/login");
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success(t("layout.logoutSuccess"));
    navigate("/login");
  };
  const isActive = (to: string) => pathname.startsWith(to);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-border">
        <Link
          to="/owner/venues"
          className="font-heading text-xl font-extrabold text-brand-orange no-underline"
        >
          Matchill
        </Link>
        <span className="px-2 py-0.5 rounded-md bg-[#ddeeff] text-brand-navy text-[11px] font-bold">
          {t("roles.owner")}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-4 mx-3 mt-4 mb-2 rounded-xl bg-brand-surface-orange">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 gradient-orange-diag text-sm font-bold text-white font-heading">
          {user?.name?.[0] ?? "O"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-dark font-heading">{user?.name}</p>
          <p className="text-xs text-brand-muted truncate">{user?.email}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all no-underline text-sm
                ${active ? "bg-brand-orange text-white font-semibold" : "text-brand-body font-normal hover:bg-brand-surface-orange"}`}
            >
              <span className={active ? "opacity-100" : "opacity-70"}>{item.icon}</span>
              {t(item.key)}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 flex flex-col gap-2">
        <Link
          to="/discover"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-brand-muted no-underline text-sm"
        >
          <LayoutDashboard size={18} /> {t("owner.playerView")}
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
            className="lg:hidden p-2 rounded-lg hover:bg-brand-surface-orange transition-colors text-brand-body"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <LanguageSwitcher className="mr-1" />
          <button
            type="button"
            title={t("owner.layout.notifications", { defaultValue: "Notifications" })}
            className="p-2 rounded-full hover:bg-brand-surface-orange transition-colors text-brand-body"
          >
            <Bell size={18} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-orange-diag text-[13px] font-bold text-white font-heading">
            {user?.name?.[0] ?? "O"}
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
