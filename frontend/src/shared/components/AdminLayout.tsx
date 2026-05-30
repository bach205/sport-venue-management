import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BarChart3,
  LogOut,
  Bell,
  Settings,
  Menu,
  ChevronRight,
  Flag,
} from "lucide-react";
import { logout } from "../../features/auth/store/authSlice";
import { getAdminStats } from "../../features/admin/store/adminStore";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useTranslation } from "react-i18next";

const NAV = [
  { to: "/admin", exact: true, icon: <LayoutDashboard size={18} />, key: "admin.nav.overview" },
  { to: "/admin/users", exact: false, icon: <Users size={18} />, key: "admin.nav.users" },
  { to: "/admin/reports", exact: false, icon: <Flag size={18} />, key: "admin.nav.reports" },
  { to: "/admin/analytics", exact: false, icon: <BarChart3 size={18} />, key: "admin.nav.analytics" },
  { to: "/admin/settings", exact: false, icon: <Settings size={18} />, key: "admin.nav.system" },
];

export default function AdminLayout() {
  const { t } = useTranslation("matching");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const stats = getAdminStats();

  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/login");
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success(t("layout.logoutSuccess"));
    navigate("/login");
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
              {item.key === "admin.nav.reports" && stats.pendingVerification > 0 && (
                <span
                  className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${active ? "bg-white/30 text-white" : "bg-[#ffd6d6] text-brand-red"}`}
                >
                  {stats.pendingVerification}
                </span>
              )}
              {active && item.key !== "admin.nav.reports" && (
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
          {stats.suspendedUsers > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd6d6]">
              <ShieldAlert size={14} className="text-brand-red" />
              <span className="text-xs font-semibold text-brand-red">
                {t("admin.suspendedUsers", { count: stats.suspendedUsers })}
              </span>
            </div>
          )}
          <button className="p-2 rounded-full hover:bg-brand-surface-orange text-brand-body">
            <Bell size={18} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center gradient-red-diag text-[13px] font-bold text-white font-heading">
            {user?.name?.[0] ?? "A"}
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
