import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Plus,
  MapPin,
  Clock3,
  ArrowRight,
  Pencil,
  CalendarDays,
  Wallet,
  Trash2,
  Search,
  Sparkles,
  Building2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { uploadImage } from "@/shared/api/uploadApi";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import {
  createOwnerVenue,
  deleteOwnerVenue,
  fetchOwnerVenues,
  type CreateVenuePayload,
  type OwnerVenue,
} from "@/features/owner/api/ownerVenueApi";

function createScheduleRange(): CreateVenuePayload["weekly_schedule"][number] {
  return {
    day_of_week: 1,
    start_time: "06:00",
    end_time: "22:00",
  };
}

const EMPTY_FORM: CreateVenuePayload = {
  name: "",
  location: "",
  phone_number: "",
  description: "",
  image_url: "",
  slot_price: 120000,
  slot_duration_minutes: 60,
  weekly_schedule: [createScheduleRange()],
};

const DAY_OPTIONS = [
  { value: 0 },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
];

function formatPrice(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale).format(value)}₫`;
}

function summarizeSchedule(venue: OwnerVenue, t: TFunction) {
  if (!venue.weeklySchedule.length) return t("owner.dashboard.noSchedule");
  const first = venue.weeklySchedule[0];
  return `${t(`owner.days.${first.dayOfWeek}`)} · ${first.startTime} - ${first.endTime}`;
}

export default function VenueOwnerDashboard() {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateVenuePayload>(EMPTY_FORM);
  const [scheduleDraft, setScheduleDraft] = useState<CreateVenuePayload["weekly_schedule"][number]>(createScheduleRange());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const loadVenues = async () => {
    try {
      setLoading(true);
      const items = await fetchOwnerVenues();
      setVenues(items);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const filteredVenues = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return venues;
    return venues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(keyword) ||
        venue.location.toLowerCase().includes(keyword) ||
        venue.description.toLowerCase().includes(keyword)
    );
  }, [search, venues]);

  const stats = useMemo(() => {
    const totalRanges = venues.reduce((sum, venue) => sum + venue.weeklySchedule.length, 0);
    const avgPrice = venues.length
      ? Math.round(venues.reduce((sum, venue) => sum + venue.slotPrice, 0) / venues.length)
      : 0;

    return [
      { label: t("owner.dashboard.totalVenues"), value: String(venues.length).padStart(2, "0"), icon: "🏟️" },
      { label: t("owner.dashboard.activeRanges"), value: String(totalRanges).padStart(2, "0"), icon: "📅" },
      { label: t("owner.dashboard.averagePrice"), value: formatPrice(avgPrice, locale), icon: "💰" },
    ];
  }, [locale, t, venues]);

  const handleCreateVenue = async () => {
    if (!form.name.trim() || !form.location.trim() || !form.phone_number.trim()) {
      toast.error(t("owner.dashboard.requiredFields"));
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = form.image_url || "";
      if (imageFile) {
        const uploadResult = await uploadImage(imageFile);
        if (!uploadResult.success || !uploadResult.data?.imageUrl) {
          throw new Error(uploadResult.message || t("owner.dashboard.imageUploadError"));
        }
        imageUrl = uploadResult.data.imageUrl;
      }

      const created = await createOwnerVenue({
        ...form,
        image_url: imageUrl,
      });
      setVenues((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setScheduleDraft(createScheduleRange());
      setImageFile(null);
      setImagePreviewUrl("");
      setShowCreateForm(false);
      toast.success(t("owner.dashboard.createSuccess"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.dashboard.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVenue = async (venue: OwnerVenue) => {
    const confirmed = window.confirm(t("owner.dashboard.deleteConfirm", { name: venue.name }));
    if (!confirmed) return;

    setDeletingId(venue.id);
    try {
      await deleteOwnerVenue(venue.id);
      setVenues((current) => current.filter((item) => item.id !== venue.id));
      toast.success(t("owner.dashboard.deleteSuccess", { name: venue.name }));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.dashboard.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const updateWeeklyScheduleItem = (
    index: number,
    key: keyof CreateVenuePayload["weekly_schedule"][number],
    value: number | string
  ) => {
    setForm((prev) => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addWeeklyScheduleItem = () => {
    setForm((prev) => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.some((item) => item.day_of_week === scheduleDraft.day_of_week)
        ? prev.weekly_schedule.map((item) =>
            item.day_of_week === scheduleDraft.day_of_week ? { ...scheduleDraft } : item
          )
        : [...prev.weekly_schedule, { ...scheduleDraft }],
    }));
  };

  const removeWeeklyScheduleItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section
          className="overflow-hidden rounded-[28px] border bg-white"
          style={{ borderColor: "#dfc0b3", boxShadow: "0 20px 40px rgba(36,25,20,0.08)" }}
        >
          <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="p-7 lg:p-9">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "#dfc0b3", background: "#fff1eb" }}>
                <Sparkles size={14} className="text-[#a04100]" />
                <span className="uppercase tracking-[0.18em] text-[#a04100]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
                  {t("owner.dashboard.heroBadge", { defaultValue: "Owner Control Center" })}
                </span>
              </div>

              <h1 className="text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "34px", fontWeight: 700, lineHeight: 1.15 }}>
                {t("owner.dashboard.title")}
              </h1>

              <p className="mt-3 max-w-2xl text-[#584238]" style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", lineHeight: 1.7 }}>
                {t("owner.dashboard.subtitle")}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setShowCreateForm((value) => !value)}
                  className="h-12 rounded-xl px-5 gap-2 border-0"
                  style={{ background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)", color: "#fff", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}
                >
                  {showCreateForm ? <X size={18} /> : <Plus size={18} />}
                  {showCreateForm ? t("owner.dashboard.closeCreateForm") : t("owner.dashboard.createVenue")}
                </Button>

                <div className="relative min-w-[280px] flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7266]" size={16} />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("owner.dashboard.searchPlaceholder")}
                    className="h-12 border-[#dfc0b3] pl-9 focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t p-7 lg:border-l lg:border-t-0 lg:p-9" style={{ borderColor: "#f4ded5", background: "linear-gradient(180deg, #fff8f3 0%, #fff 100%)" }}>
              <div className="grid grid-cols-1 gap-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border bg-white p-4" style={{ borderColor: "#dfc0b3" }}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="rounded-full px-2 py-1" style={{ background: "#fff1eb", border: "1px solid #dfc0b3", color: "#a04100", fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
                        {t("owner.dashboard.apiBadge", { defaultValue: "API" })}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 700, color: "#241914" }}>{item.value}</h3>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {showCreateForm && (
          <section className="rounded-[28px] border bg-white p-6 lg:p-7" style={{ borderColor: "#dfc0b3" }}>
            <div className="mb-5">
              <p className="text-[#a04100] uppercase tracking-[0.18em]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
                {t("owner.dashboard.createBadge", { defaultValue: "Create Venue" })}
              </p>
              <h2 className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 700 }}>
                {t("owner.dashboard.createTitle")}
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.name")}</Label>
                <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.location")}</Label>
                <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.phone")}</Label>
                <Input value={form.phone_number} onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label>{t("owner.dashboard.fields.image")}</Label>
                <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
                  <div className="overflow-hidden rounded-2xl border bg-[#fffaf7]" style={{ borderColor: "#dfc0b3", height: 140 }}>
                    {imagePreviewUrl || form.image_url ? (
                      <ImageWithFallback src={imagePreviewUrl || form.image_url || ""} alt={form.name || t("owner.dashboard.venuePreviewAlt", { defaultValue: "Venue preview" })} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">🏟️</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                        setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
                      }}
                      className="h-11 border-[#dfc0b3] pt-2 focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                    />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>
                      {t("owner.dashboard.imageHint")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.slotPrice")}</Label>
                <Input type="number" value={form.slot_price} onChange={(e) => setForm((prev) => ({ ...prev, slot_price: Number(e.target.value) || 0 }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.slotDuration")}</Label>
                <Input type="number" value={form.slot_duration_minutes} onChange={(e) => setForm((prev) => ({ ...prev, slot_duration_minutes: Number(e.target.value) || 60 }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.activeDay")}</Label>
                <select
                  value={scheduleDraft.day_of_week}
                  onChange={(e) => setScheduleDraft((prev) => ({ ...prev, day_of_week: Number(e.target.value) }))}
                  className="h-11 w-full rounded-xl border px-3"
                  style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>{t(`owner.days.${day.value}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("owner.dashboard.fields.timeRange")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" value={scheduleDraft.start_time} onChange={(e) => setScheduleDraft((prev) => ({ ...prev, start_time: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
                  <Input type="time" value={scheduleDraft.end_time} onChange={(e) => setScheduleDraft((prev) => ({ ...prev, end_time: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
                </div>
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label>{t("owner.dashboard.fields.description")}</Label>
                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 700, color: "#241914" }}>
                      {t("owner.dashboard.scheduleListTitle", { defaultValue: "Weekly Schedule List" })}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addWeeklyScheduleItem}
                      className="h-9 rounded-xl border-[#dfc0b3] text-[#584238] hover:bg-[#fff1eb]"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                    >
                      <Plus data-icon="inline-start" />
                      {t("owner.dashboard.addRange", { defaultValue: "Add Range" })}
                    </Button>
                  </div>
                  {form.weekly_schedule.length ? (
                    form.weekly_schedule.map((item, index) => (
                      <div
                        key={`${item.day_of_week}-${item.start_time}-${item.end_time}-${index}`}
                        className="rounded-2xl border p-3"
                        style={{ borderColor: "#dfc0b3", background: "#fffaf7" }}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 700, color: "#241914" }}>
                            {t("owner.dashboard.rangeLabel", { defaultValue: "Range {{count}}", count: index + 1 })}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeWeeklyScheduleItem(index)}
                            className="h-8 rounded-lg px-2 text-[#a04100] hover:bg-[#fff1eb] hover:text-[#a04100]"
                            style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                          >
                            <Trash2 data-icon="inline-start" />
                            {t("owner.dashboard.remove", { defaultValue: "Remove" })}
                          </Button>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                          <select
                            value={item.day_of_week}
                            onChange={(e) => updateWeeklyScheduleItem(index, "day_of_week", Number(e.target.value))}
                            className="h-11 w-full rounded-xl border px-3"
                            style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}
                          >
                            {DAY_OPTIONS.map((day) => (
                              <option key={day.value} value={day.value}>{t(`owner.days.${day.value}`)}</option>
                            ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={item.start_time}
                              onChange={(e) => updateWeeklyScheduleItem(index, "start_time", e.target.value)}
                              className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                            />
                            <Input
                              type="time"
                              value={item.end_time}
                              onChange={(e) => updateWeeklyScheduleItem(index, "end_time", e.target.value)}
                              className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                <div className="rounded-2xl border border-dashed p-4 text-[#8b7266]" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                      {t("owner.dashboard.noScheduleDraft", { defaultValue: "No schedule ranges yet. You can create the venue first or add weekly schedule rows now." })}
                    </div>
                  )}
                </div>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="min-h-[120px] w-full rounded-xl border px-3 py-3 outline-none transition-colors focus:border-[#006a65]" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#241914" }} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleCreateVenue} disabled={submitting} className="h-11 rounded-xl px-5 border-0" style={{ background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)", color: "#fff", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}>
                {submitting ? t("owner.dashboard.creating") : t("owner.dashboard.saveVenue")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setForm(EMPTY_FORM); setScheduleDraft(createScheduleRange()); setImageFile(null); setImagePreviewUrl(""); setShowCreateForm(false); }} className="h-11 rounded-xl border-[#dfc0b3] text-[#584238] hover:bg-[#fff1eb]" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                {t("owner.dashboard.cancel")}
              </Button>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#a04100] uppercase tracking-[0.18em]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
                {t("owner.dashboard.libraryBadge", { defaultValue: "Venue Library" })}
              </p>
              <h2 className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "28px", fontWeight: 700 }}>
                {t("owner.dashboard.libraryTitle")}
              </h2>
            </div>
            <p className="text-[#8b7266]" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
              {t("owner.dashboard.visibleCount", { count: filteredVenues.length })}
            </p>
          </div>

          {loading ? (
            <div className="rounded-[28px] border bg-white p-10 text-center" style={{ borderColor: "#dfc0b3" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8b7266" }}>{t("owner.dashboard.loading")}</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="rounded-[28px] border bg-white p-10 text-center" style={{ borderColor: "#dfc0b3" }}>
              <Building2 size={40} className="mx-auto mb-3 text-[#dfc0b3]" />
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#584238" }}>
                {t("owner.dashboard.empty")}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredVenues.map((venue) => (
                <article key={venue.id} className="overflow-hidden rounded-[28px] border bg-white" style={{ borderColor: "#dfc0b3", boxShadow: "0 14px 32px rgba(36,25,20,0.06)" }}>
                  <div className="h-48 overflow-hidden bg-gradient-to-br from-[#ffd9c6] to-[#fff1eb]">
                    {venue.imageUrl ? (
                      <ImageWithFallback src={venue.imageUrl} alt={venue.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">🏟️</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 700, color: "#241914" }}>{venue.name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-[#584238]">
                          <MapPin size={15} />
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}>{venue.location}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[#584238]">
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}>{venue.phoneNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/owner/venues/${venue.id}`}>
                          <button className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-[#fff1eb]" style={{ borderColor: "#dfc0b3" }}>
                            <Pencil size={16} className="text-[#a04100]" />
                          </button>
                        </Link>
                        <button onClick={() => handleDeleteVenue(venue)} disabled={deletingId === venue.id} className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-[#fff0f0] disabled:opacity-50" style={{ borderColor: "#f0c5c5" }}>
                          <Trash2 size={16} className="text-[#ba1a1a]" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl p-3" style={{ background: "#fef4ef" }}>
                        <Wallet size={16} className="mb-2 text-[#a04100]" />
                        <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914" }}>{formatPrice(venue.slotPrice, locale)}</p>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238" }}>{t("owner.dashboard.perSlot")}</span>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: "#eefbf7" }}>
                        <Clock3 size={16} className="mb-2 text-[#006a65]" />
                        <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914" }}>{venue.slotDurationMinutes}m</p>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238" }}>{t("owner.dashboard.duration")}</span>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: "#f3f7ff" }}>
                        <CalendarDays size={16} className="mb-2 text-[#1a5fb4]" />
                        <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914" }}>{venue.weeklySchedule.length}</p>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238" }}>{t("owner.dashboard.rangesPerWeek")}</span>
                      </div>
                    </div>

                    <div className="mb-4 rounded-2xl px-3 py-2" style={{ background: "#fff8f3" }}>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>{t("owner.dashboard.sampleSchedule")}</p>
                      <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 700, color: "#241914" }}>{summarizeSchedule(venue, t)}</p>
                    </div>

                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238", lineHeight: 1.6 }}>{venue.description}</p>

                    <div className="mt-5 flex items-center gap-3">
                      <Link to={`/owner/venues/${venue.id}`} className="flex-1">
                        <Button className="h-11 w-full rounded-xl gap-2 border-0" style={{ background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)", color: "#fff", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}>
                          {t("owner.dashboard.manageVenue")}
                          <ArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
