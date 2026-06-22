import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Facebook,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { fetchPosts } from "@/features/discover/api/discoverApi";
import type { DiscoverPost } from "@/features/discover/types/discover.types";
import { fetchVenues } from "@/features/venues/api/venuesApi";
import { VenueCard } from "@/features/venues/components/VenueCard";
import type { Venue } from "@/features/venues/types/venues.types";
import { getFeed } from "@/features/feed/api/socialApi";
import type { ApiPost } from "@/features/feed/types/feed.types";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { SURVEY_URL } from "@/shared/constants/survey";

const HERO_IMAGE = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=85";

const FACEBOOK_URL = "https://www.facebook.com/share/1BH6pEeLth/?mibextid=wwXIfr";

const SEARCH_SUGGESTIONS = [
  { labelKey: "home.search.suggestions.badminton", value: "Badminton" },
  { labelKey: "home.search.suggestions.tennis", value: "Tennis" },
  { labelKey: "home.search.suggestions.pickleball", value: "Pickleball" },
];

const footerLinkClass =
  "inline-flex items-center gap-2 text-[#584238] no-underline transition-colors hover:text-[#a04100]";
const footerIconClass = "h-4 w-4 shrink-0 text-[#a04100]";

function createMarketplacePreview(t: TFunction<"matching">): ApiPost[] {
  const now = new Date().toISOString();

  return [
    {
      id: "preview-racket",
      intentType: "sell",
      sport: "Badminton",
      category: "Equipment",
      itemType: "racket",
      title: t("home.marketplace.preview.racket.title"),
      details: t("home.marketplace.preview.racket.details"),
      quantity: 1,
      priceType: "fixed",
      priceMin: 1250000,
      currency: "VND",
      condition: "like_new",
      status: "open",
      author: { id: "preview-1", email: "", name: "Minh Anh" },
      createdAt: now,
      updatedAt: now,
      likeCount: 8,
      commentCount: 2,
      isOwner: false,
      hasLiked: false,
    },
    {
      id: "preview-shoes",
      intentType: "buy",
      sport: "Tennis",
      category: "Apparel",
      itemType: "shoes",
      title: t("home.marketplace.preview.shoes.title"),
      details: t("home.marketplace.preview.shoes.details"),
      quantity: 1,
      priceType: "range",
      priceMin: 700000,
      priceMax: 1400000,
      currency: "VND",
      condition: "used",
      status: "open",
      author: { id: "preview-2", email: "", name: "Hoang Vu" },
      createdAt: now,
      updatedAt: now,
      likeCount: 3,
      commentCount: 1,
      isOwner: false,
      hasLiked: false,
    },
    {
      id: "preview-ball",
      intentType: "sell",
      sport: "Pickleball",
      category: "Accessories",
      itemType: "balls",
      title: t("home.marketplace.preview.ball.title"),
      details: t("home.marketplace.preview.ball.details"),
      quantity: 2,
      priceType: "fixed",
      priceMin: 260000,
      currency: "VND",
      condition: "new",
      status: "open",
      author: { id: "preview-3", email: "", name: "Linh Tran" },
      createdAt: now,
      updatedAt: now,
      likeCount: 5,
      commentCount: 0,
      isOwner: false,
      hasLiked: false,
    },
  ];
}

function toISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatPrice(value: number | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.NumberFormat(locale).format(value) + "đ";
}

function MarketplacePreviewCard({ post, onContact }: { post: ApiPost; onContact: () => void }) {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const priceFallback = t("home.marketplace.negotiable");

  return (
    <article className="flex min-h-[178px] flex-col rounded-lg border border-[#e8d2c8] bg-white p-4 shadow-[0_8px_24px_rgba(36,25,20,0.06)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            post.intentType === "sell"
              ? "bg-[#fff1eb] text-[#a04100]"
              : "bg-[#e7f8f7] text-[#006a65]"
          }`}
        >
          {t(`home.marketplace.intent.${post.intentType}`)}
        </span>
        <span className="text-[12px] font-semibold text-[#8b7266]">{post.sport}</span>
      </div>
      <h3 className="font-heading text-[15px] font-bold leading-snug text-[#241914]">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#584238]">{post.details}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="font-heading text-[16px] font-extrabold text-[#a04100]">
          {post.priceType === "range"
            ? `${formatPrice(post.priceMin, locale, priceFallback)} - ${formatPrice(post.priceMax, locale, priceFallback)}`
            : formatPrice(post.priceMin, locale, priceFallback)}
        </span>
        <button
          type="button"
          onClick={onContact}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a04100] px-3 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle size={13} />
          {t("home.actions.message")}
        </button>
      </div>
    </article>
  );
}

function DiscoverPreviewCard({ post, onContact }: { post: DiscoverPost; onContact: () => void }) {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const eventDate = new Date(post.time);

  return (
    <article className="flex min-h-[196px] flex-col rounded-lg border border-[#d7ece8] bg-white p-4 shadow-[0_8px_24px_rgba(36,25,20,0.06)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-[15px] font-bold text-[#241914]">{post.author.name}</p>
          <p className="mt-1 text-[12px] text-[#8b7266]">
            {eventDate.toLocaleDateString(locale, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            · {eventDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className="rounded-full bg-[#e7f8f7] px-2.5 py-1 text-[12px] font-bold text-[#006a65]">
          {post.sport}
        </span>
      </div>
      <p className="line-clamp-3 text-[13px] leading-relaxed text-[#584238]">{post.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[#584238]">
          <MapPin size={13} className="shrink-0 text-[#8b7266]" />
          <span className="truncate">{post.location}</span>
        </span>
        <button
          type="button"
          onClick={onContact}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#a04100] px-3 text-[12px] font-bold text-[#a04100] transition-colors hover:bg-[#fff1eb]"
        >
          <Users size={13} />
          {t("home.actions.join")}
        </button>
      </div>
    </article>
  );
}

export default function GuestHomePage() {
  const { t } = useTranslation("matching");
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useAuthGuard();
  const [query, setQuery] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<DiscoverPost[]>([]);
  const [marketPosts, setMarketPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const fallbackMarketPosts = useMemo(() => createMarketplacePreview(t), [t]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      const [venueResult, discoverResult, feedResult] = await Promise.allSettled([
        fetchVenues({ page: 1, limit: 3, date: toISODate(new Date()) }),
        fetchPosts(),
        isAuthenticated ? getFeed({ page: 1, limit: 3 }) : Promise.resolve(null),
      ]);

      if (cancelled) return;

      if (venueResult.status === "fulfilled") setVenues(venueResult.value.items.slice(0, 3));
      if (discoverResult.status === "fulfilled" && discoverResult.value.success) {
        setDiscoverPosts(discoverResult.value.data.slice(0, 3));
      }
      if (feedResult.status === "fulfilled" && feedResult.value?.success && feedResult.value.data) {
        setMarketPosts(feedResult.value.data.items.slice(0, 3));
      } else {
        setMarketPosts([]);
      }
      setLoading(false);
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const venueCountLabel = useMemo(() => {
    if (venues.length === 0) return t("home.stats.venuesFallback");
    return t("home.stats.venuesCount", { count: venues.length });
  }, [t, venues.length]);

  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/venues?search=${encodeURIComponent(trimmed)}` : "/venues");
  };

  const handleSuggestedSearch = (value: string) => {
    setQuery(value);
    navigate(`/venues?search=${encodeURIComponent(value)}`);
  };

  const handlePrivateAction = (path: string) => {
    if (!requireAuth()) return;
    navigate(path);
  };

  return (
    <div className="min-h-full bg-[#fff8f6]">
      <section className="relative min-h-[520px] overflow-hidden bg-[#241914]">
        <img
          src={HERO_IMAGE}
          alt={t("home.hero.imageAlt")}
          className="absolute inset-0 h-full w-full object-cover opacity-72"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(36,25,20,0.88),rgba(36,25,20,0.48),rgba(36,25,20,0.16))]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-screen-xl flex-col justify-center px-6 py-12">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur">
              <Sparkles size={14} />
              {t("home.hero.badge")}
            </span>
            <h1 className="font-heading text-[42px] font-extrabold leading-[1.08] text-white sm:text-[58px]">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-white/88">
              {t("home.hero.subtitle")}
            </p>
            <form
              onSubmit={handleSearch}
              className="mt-8 flex w-full max-w-2xl items-center gap-2 rounded-lg bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
            >
              <Search size={20} className="ml-2 shrink-0 text-[#8b7266]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("home.search.placeholder")}
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-[14px] text-[#241914] outline-none placeholder:text-[#8b7266]"
              />
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.value}
                    type="button"
                    onClick={() => handleSuggestedSearch(suggestion.value)}
                    className="h-8 rounded-full border border-[#e8d2c8] bg-[#fff8f6] px-3 text-[12px] font-bold text-[#a04100] transition-colors hover:border-[#a04100] hover:bg-[#fff1eb]"
                  >
                    {t(suggestion.labelKey)}
                  </button>
                ))}
              </div>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-semibold text-white/90">
              <span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
                {venueCountLabel}
              </span>
              <span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
                {t("home.stats.matches")}
              </span>
              <span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
                {t("home.stats.login")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e8d2c8] bg-white">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate("/venues")}
            className="flex h-20 items-center gap-3 rounded-lg border border-[#e8d2c8] bg-[#fff8f6] px-4 text-left transition-colors hover:border-[#a04100]"
          >
            <MapPin size={20} className="text-[#a04100]" />
            <span className="font-heading text-[14px] font-bold text-[#241914]">
              {t("home.quickActions.venues")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/discover")}
            className="flex h-20 items-center gap-3 rounded-lg border border-[#d7ece8] bg-[#f4fbfa] px-4 text-left transition-colors hover:border-[#006a65]"
          >
            <Users size={20} className="text-[#006a65]" />
            <span className="font-heading text-[14px] font-bold text-[#241914]">
              {t("home.quickActions.players")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="flex h-20 items-center gap-3 rounded-lg border border-[#e8d2c8] bg-[#fff8f6] px-4 text-left transition-colors hover:border-[#a04100]"
          >
            <ShoppingBag size={20} className="text-[#a04100]" />
            <span className="font-heading text-[14px] font-bold text-[#241914]">
              {t("home.quickActions.marketplace")}
            </span>
          </button>
        </div>
      </section>

      <section className="border-b border-[#f0cfab] bg-[#fff4e8]">
        <div className="mx-auto flex max-w-screen-xl flex-col items-start justify-between gap-5 px-6 py-7 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white p-3 text-[#a04100] shadow-sm">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#a04100]">
                {t("survey.card.eyebrow")}
              </p>
              <h2 className="mt-1 font-heading text-[22px] font-extrabold text-[#241914]">
                {t("survey.card.title")}
              </h2>
              <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[#584238]">
                {t("survey.card.description")}
              </p>
            </div>
          </div>
          <a
            href={SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-[#a04100] px-4 py-2.5 text-sm font-bold text-white no-underline transition-opacity hover:opacity-90"
          >
            {t("survey.cta")}
          </a>
        </div>
      </section>

      <main className="mx-auto flex max-w-screen-xl flex-col gap-10 px-6 py-10">
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-[24px] font-extrabold text-[#241914]">
                {t("home.featuredVenues.title")}
              </h2>
              <p className="mt-1 text-[14px] text-[#584238]">{t("home.featuredVenues.subtitle")}</p>
            </div>
            <Link to="/venues" className="text-[13px] font-bold text-[#a04100] hover:underline">
              {t("home.actions.viewAll")}
            </Link>
          </div>
          {loading && venues.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-[#a04100]" />
            </div>
          ) : venues.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onClick={() => navigate(`/venues/${venue.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#e8d2c8] bg-white px-5 py-8 text-center text-[14px] text-[#584238]">
              {t("home.featuredVenues.empty")}
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-[24px] font-extrabold text-[#241914]">
                {t("home.discover.title")}
              </h2>
              <p className="mt-1 text-[14px] text-[#584238]">{t("home.discover.subtitle")}</p>
            </div>
            <Link to="/discover" className="text-[13px] font-bold text-[#a04100] hover:underline">
              {t("home.actions.openDiscover")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {discoverPosts.length > 0 ? (
              discoverPosts.map((post) => (
                <DiscoverPreviewCard
                  key={post.id}
                  post={post}
                  onContact={() =>
                    handlePrivateAction(
                      `/messages?with=${post.author.id}&name=${encodeURIComponent(post.author.name)}`
                    )
                  }
                />
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-dashed border-[#d7ece8] bg-white px-5 py-8 text-center text-[14px] text-[#584238]">
                {t("home.discover.empty")}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-[24px] font-extrabold text-[#241914]">
                {t("home.marketplace.title")}
              </h2>
              <p className="mt-1 text-[14px] text-[#584238]">{t("home.marketplace.subtitle")}</p>
            </div>
            <Link to="/feed" className="text-[13px] font-bold text-[#a04100] hover:underline">
              {t("home.actions.openFeed")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {(marketPosts.length > 0 ? marketPosts : fallbackMarketPosts).map((post) => (
              <MarketplacePreviewCard
                key={post.id}
                post={post}
                onContact={() =>
                  handlePrivateAction(
                    `/messages?with=${post.author.id}&name=${encodeURIComponent(post.author.name)}`
                  )
                }
              />
            ))}
          </div>
        </section>

        {!isAuthenticated && (
          <section className="flex flex-col items-start justify-between gap-4 rounded-lg border border-[#e8d2c8] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(36,25,20,0.06)] sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-[20px] font-extrabold text-[#241914]">
                {t("home.cta.title")}
              </h2>
              <p className="mt-1 text-[14px] text-[#584238]">{t("home.cta.subtitle")}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#a04100] px-5 font-heading text-[14px] font-bold text-white no-underline transition-opacity hover:opacity-90"
              >
                {t("layout.login")}
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#a04100] px-5 font-heading text-[14px] font-bold text-[#a04100] no-underline transition-colors hover:bg-[#fff1eb]"
              >
                {t("home.cta.register")}
              </Link>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[#e8d2c8] bg-white">
        <div className="mx-auto grid max-w-screen-xl gap-8 px-6 py-9 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_0.85fr_0.85fr]">
          <div>
            <Link to="/home" className="inline-flex items-center gap-3 no-underline">
              <img src="/logo.png" alt="Matchill Logo" className="h-12 w-12 object-contain" />
              <span className="font-heading text-[18px] font-extrabold text-[#a04100]">
                Matchill
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-[13px] leading-6 text-[#584238]">
              {t("home.footer.description")}
            </p>
          </div>

          <div>
            <h3 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#241914]">
              {t("home.footer.explore")}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-[13px] font-semibold">
              <Link to="/venues" className={footerLinkClass}>
                <MapPin className={footerIconClass} />
                {t("nav.venues")}
              </Link>
              <Link to="/discover" className={footerLinkClass}>
                <Users className={footerIconClass} />
                {t("nav.discover")}
              </Link>
              <Link to="/feed" className={footerLinkClass}>
                <ShoppingBag className={footerIconClass} />
                {t("nav.feed")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#241914]">
              {t("home.footer.support")}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-[13px] font-semibold">
              <Link to="/feedback" className={footerLinkClass}>
                <MessageCircle className={footerIconClass} />
                {t("nav.feedback")}
              </Link>
              <a href="mailto:support@matchill.io.vn" className={footerLinkClass}>
                <Mail className={footerIconClass} />
                {t("home.footer.contact")}
              </a>
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className={footerLinkClass}>
                <Facebook className={footerIconClass} />
                Facebook
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-[13px] font-extrabold uppercase tracking-wide text-[#241914]">
              {t("home.footer.legal")}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-[13px] font-semibold text-[#584238]">
              <span className="inline-flex items-center gap-2">
                <FileText className={footerIconClass} />
                {t("home.footer.terms")}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className={footerIconClass} />
                {t("home.footer.privacy")}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className={footerIconClass} />
                {t("home.footer.refundPolicy")}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-[#f0ded6] px-6 py-4">
          <p className="mx-auto max-w-screen-xl text-[12px] text-[#8b7266]">
            {t("home.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
