import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router";
import {
  Bell,
  LogIn,
  ChevronDown,
  LogOut,
  User,
  Building2,
  ShieldCheck,
  Wallet,
  MessageSquare,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { MatchingFAB } from "../../features/matching/components/MatchingFAB";
import { logout } from "../../features/auth/store/authSlice";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TotalViewCounter } from "./TotalViewCounter";
import { useTranslation } from "react-i18next";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import {
  SURVEY_DISMISSED_KEY,
  SURVEY_PROMPT_SEEN_KEY,
  SURVEY_URL,
} from "@/shared/constants/survey";

const NAV_LINKS = [
  { key: "nav.home", to: "/home" },
  { key: "nav.discover", to: "/discover" },
  { key: "nav.feed", to: "/feed" },
  { key: "nav.venues", to: "/venues" },
  { key: "nav.bookings", to: "/bookings", requiresAuth: true },
  { key: "nav.messages", to: "/messages", requiresAuth: true },
  { key: "nav.feedback", to: "/feedback", requiresAuth: true },
];

const ROLE_BADGE = {
  user: { bg: "bg-[#d0f5ee] text-[#00785e]", key: "roles.user" },
  owner: { bg: "bg-[#ddeeff] text-brand-navy", key: "roles.owner" },
  admin: { bg: "bg-[#ffd6d6] text-brand-red", key: "roles.admin" },
};

export default function AppLayout() {
  const { t } = useTranslation("matching");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { requireAuth } = useAuthGuard();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSurveyVisible, setIsSurveyVisible] = useState(
    () => localStorage.getItem(SURVEY_DISMISSED_KEY) !== "true"
  );
  const [isSurveyPromptOpen, setIsSurveyPromptOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/home" || localStorage.getItem(SURVEY_PROMPT_SEEN_KEY) === "true") {
      return;
    }

    const timer = window.setTimeout(() => {
      localStorage.setItem(SURVEY_PROMPT_SEEN_KEY, "true");
      setIsSurveyPromptOpen(true);
    }, 12_000);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  const isActive = (to: string) => {
    if (to === "/home") return pathname === "/" || pathname === "/home";
    if (to === "/discover") return pathname === "/discover";
    if (to === "/venues") return pathname.startsWith("/venues");
    return pathname.startsWith(to);
  };

  const handleLogout = () => {
    dispatch(logout()); // also auto-clears profile via profileSlice extraReducers
    toast.success(t("layout.logoutSuccess"));
    navigate("/login");
    setUserMenuOpen(false);
  };

  const handleAuthNavigation = (event: MouseEvent<HTMLAnchorElement>, requiresAuth?: boolean) => {
    if (requiresAuth && !requireAuth()) {
      event.preventDefault();
    }
  };

  const dismissSurvey = () => {
    localStorage.setItem(SURVEY_DISMISSED_KEY, "true");
    setIsSurveyVisible(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface">
      <header className="sticky top-0 z-20 bg-brand-surface border-b border-brand-border shadow-sm">
        <div className="mx-auto flex h-[60px] max-w-[1536px] items-center justify-between px-3">
          <div className="flex min-w-0 items-center gap-1 sm:gap-3 xl:gap-10">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                setMobileNavOpen(true);
              }}
              aria-label={t("layout.openMenu")}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
              className="xl:hidden p-2 rounded-lg hover:bg-brand-surface-orange transition-colors text-brand-body"
            >
              <Menu size={20} />
            </button>
            <Link
              to="/home"
              className="inline-flex shrink-0 items-center font-heading text-md font-extrabold text-brand-orange no-underline"
            >
              <img src="/logo.png" alt="Logo" className="w-14 h-14 inline-block object-contain" />
              <span className="hidden sm:inline">Matchill</span>
            </Link>
            <nav className="hidden xl:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(event) => handleAuthNavigation(event, link.requiresAuth)}
                  className={`relative shrink-0 whitespace-nowrap pb-1.5 transition-colors no-underline font-heading text-[15px]
                    ${isActive(link.to) ? "font-bold text-brand-orange" : "font-normal text-brand-body"}`}
                >
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
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-bold text-brand-orange no-underline transition-colors hover:bg-brand-surface-orange"
            >
              <ClipboardList size={17} />
              {t("survey.nav")}
            </a>
            <button
              type="button"
              onClick={() => requireAuth()}
              className="p-2 rounded-full hover:bg-brand-surface-orange transition-colors text-brand-body"
            >
              <Bell size={18} />
            </button>

            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-1 py-1.5 rounded-xl hover:bg-brand-surface-orange transition-colors border-[1.5px] border-brand-border"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white gradient-orange-diag font-heading">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      user.name[0]
                    )}
                  </div>
                  <p className="hidden overflow-hidden whitespace-nowrap text-ellipsis w-[50px] sm:block text-[13px] font-bold text-brand-dark font-heading leading-tight">
                    {user.name.split(" ")[0]}
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
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              user.name[0]
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-dark font-heading">
                              {user.name}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[user.role].bg}`}
                            >
                              {t(ROLE_BADGE[user.role].key)}
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
                          <User size={16} className="text-brand-orange" /> {t("layout.profile")}
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline"
                        >
                          <Wallet size={16} className="text-brand-orange" /> {t("layout.wallet")}
                        </Link>
                        <Link
                          to="/feedback"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-surface-orange transition-colors text-sm text-brand-dark no-underline"
                        >
                          <MessageSquare size={16} className="text-brand-orange" />{" "}
                          {t("nav.feedback")}
                        </Link>
                        {user.role === "owner" && (
                          <Link
                            to="/owner/venues"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ddeeff] transition-colors text-sm text-brand-navy no-underline"
                          >
                            <Building2 size={16} /> {t("layout.ownerDashboard")}
                          </Link>
                        )}
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#ffd6d6] transition-colors text-sm text-brand-red no-underline"
                          >
                            <ShieldCheck size={16} /> {t("layout.adminPanel")}
                          </Link>
                        )}
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
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 ml-2 h-9 px-4 rounded-xl hover:opacity-90 transition-opacity gradient-orange text-sm font-bold text-white no-underline font-heading"
              >
                <LogIn size={14} /> {t("layout.login")}
              </Link>
            )}
            <TotalViewCounter className="ml-1 shrink-0 px-2 sm:px-3" />
          </div>
        </div>
      </header>

      {isSurveyVisible && (
        <aside className="border-b border-[#f0cfab] bg-[#fff4e8]" aria-label={t("survey.title")}>
          <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <MessageSquare
              size={18}
              className="hidden shrink-0 text-brand-orange sm:block"
              aria-hidden="true"
            />
            <p className="min-w-0 flex-1 text-[13px] leading-5 text-brand-dark">
              <span className="font-bold">{t("survey.title")}</span> {t("survey.description")}
            </p>
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-brand-orange px-3 py-2 text-[12px] font-bold text-white no-underline transition-opacity hover:opacity-90"
            >
              {t("survey.cta")}
            </a>
            <button
              type="button"
              onClick={dismissSurvey}
              aria-label={t("survey.dismiss")}
              className="shrink-0 rounded-lg p-1 text-brand-body transition-colors hover:bg-[#ffe5cb]"
            >
              <X size={18} />
            </button>
          </div>
        </aside>
      )}

      {isSurveyPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="survey-prompt-title"
            className="relative w-full max-w-md rounded-2xl border border-[#f0cfab] bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsSurveyPromptOpen(false)}
              aria-label={t("survey.dismiss")}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-brand-body transition-colors hover:bg-brand-surface-orange"
            >
              <X size={18} />
            </button>
            <div className="mb-4 inline-flex rounded-xl bg-[#fff1e6] p-3 text-brand-orange">
              <ClipboardList size={24} />
            </div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              {t("survey.modal.eyebrow")}
            </p>
            <h2
              id="survey-prompt-title"
              className="mt-2 font-heading text-2xl font-extrabold text-brand-dark"
            >
              {t("survey.modal.title")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-brand-body">
              {t("survey.modal.description")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSurveyPromptOpen(false)}
                className="rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-bold text-white no-underline transition-opacity hover:opacity-90"
              >
                {t("survey.cta")}
              </a>
              <button
                type="button"
                onClick={() => setIsSurveyPromptOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-body transition-colors hover:bg-brand-surface-orange"
              >
                {t("survey.modal.later")}
              </button>
            </div>
          </section>
        </div>
      )}

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-brand-dark/40" />
          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-y-auto bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-[60px] items-center justify-between border-b border-brand-border px-4">
              <Link
                to="/home"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center font-heading text-md font-extrabold text-brand-orange no-underline"
              >
                <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain" />
                Matchill
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label={t("layout.closeMenu")}
                className="rounded-lg p-2 text-brand-body transition-colors hover:bg-brand-surface-orange"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(event) => {
                    handleAuthNavigation(event, link.requiresAuth);
                    if (!event.defaultPrevented) setMobileNavOpen(false);
                  }}
                  className={`rounded-xl px-3 py-3 text-sm no-underline transition-colors
                    ${isActive(link.to) ? "bg-brand-surface-orange font-bold text-brand-orange" : "font-medium text-brand-body hover:bg-brand-surface-orange"}`}
                >
                  {t(link.key)}
                </Link>
              ))}
              <a
                href={SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-brand-orange no-underline transition-colors hover:bg-brand-surface-orange"
              >
                <ClipboardList size={17} />
                {t("survey.nav")}
              </a>
              <div className="mt-3 border-t border-brand-border pt-4">
                <MatchingFAB showLabel onClose={() => setMobileNavOpen(false)} />
              </div>
            </nav>

            <div className="border-t border-brand-border px-4 py-4 sm:hidden">
              <LanguageSwitcher />
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
