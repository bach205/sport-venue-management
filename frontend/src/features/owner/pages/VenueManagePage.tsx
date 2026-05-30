import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CalendarDays,
  Settings2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LockOpen,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Users,
  Save,
  Trash2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteOwnerVenue,
  fetchOwnerRefundRequests,
  fetchOwnerVenueBookings,
  fetchOwnerVenues,
  fetchVenueSlotsByDate,
  resolveOwnerRefund,
  updateOwnerAvailability,
  updateOwnerVenue,
  updateOwnerVenueSchedule,
  type OwnerBooking,
  type OwnerRefundRequest,
  type OwnerSlot,
  type OwnerVenue,
  type UpdateVenuePayload,
} from "@/features/owner/api/ownerVenueApi";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type Tab = "bookings" | "schedule" | "settings";
type SlotAction = "unavailable" | "open";

type SettingsForm = {
  name: string;
  location: string;
  description: string;
  slotPrice: number;
  slotDurationMinutes: number;
  weeklySchedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6];

function createWeeklyScheduleEntry(): SettingsForm["weeklySchedule"][number] {
  return {
    dayOfWeek: 1,
    startTime: "06:00",
    endTime: "22:00",
  };
}

function formatPrice(n: number, locale: string) {
  return new Intl.NumberFormat(locale).format(n) + "₫";
}

function formatDate(d: string, locale: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function addDays(base: Date, amount: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + amount);
  return d;
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function toSettingsForm(venue: OwnerVenue): SettingsForm {
  return {
    name: venue.name,
    location: venue.location,
    description: venue.description,
    slotPrice: venue.slotPrice,
    slotDurationMinutes: venue.slotDurationMinutes,
    weeklySchedule: venue.weeklySchedule.length
      ? venue.weeklySchedule
      : [createWeeklyScheduleEntry()],
  };
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    hold: { bg: "#fff3cd", color: "#856404", label: "Hold" },
    payment_pending: { bg: "#fff3cd", color: "#856404", label: "Pending" },
    confirmed: { bg: "#e7f8f7", color: "#006a65", label: "Confirmed" },
    refund_processing: { bg: "#fff3cd", color: "#856404", label: "Refunding" },
    refunded: { bg: "#f4ded5", color: "#8b7266", label: "Refunded" },
    refund_rejected: { bg: "#fbe9e7", color: "#ba1a1a", label: "Rejected" },
    expired: { bg: "#f4ded5", color: "#8b7266", label: "Expired" },
  };
  const item = map[status] ?? { bg: "#f4ded5", color: "#8b7266", label: status };
  return (
    <span
      className="rounded-full px-2.5 py-1"
      style={{ background: item.bg, color: item.color, fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}
    >
      {item.label}
    </span>
  );
}

function BookingCard({
  booking,
  refundRequest,
  onApprove,
  onReject,
}: {
  booking: OwnerBooking;
  refundRequest?: OwnerRefundRequest;
  onApprove: (refund: OwnerRefundRequest) => void;
  onReject: (refund: OwnerRefundRequest) => void;
}) {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const hasManualRefund = refundRequest?.status === "pending_manual";

  return (
    <div className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "#dfc0b3" }}>
      <div className="flex flex-wrap items-start gap-4 border-b p-4" style={{ borderColor: "#f4ded5" }}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, color: "#241914" }}>
              {booking.user?.name || t("owner.manage.player")} · #{booking.id.slice(-6).toUpperCase()}
            </p>
            <StatusChip status={booking.status} />
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238", marginTop: 4 }}>
            📅 {formatDate(booking.slot.date, locale)} | ⏰ {booking.slot.startTime} - {booking.slot.endTime}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266", marginTop: 4 }}>
            {booking.user?.email || t("owner.manage.noEmail")}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "16px", fontWeight: 800, color: "#a04100" }}>
            {formatPrice(booking.amount, locale)}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266" }}>
            {booking.payment?.status || "no payment"}
          </p>
        </div>
      </div>

      {hasManualRefund && refundRequest && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ background: "#fff3cd" }}>
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: "#856404" }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#856404", fontWeight: 600 }}>
                {t("owner.manage.manualRefundRequest")}
              </span>
            </div>
            {refundRequest.note && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#856404", marginTop: 4 }}>
                {refundRequest.note}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onReject(refundRequest)} className="h-9 rounded-xl border-[#e8c4b3] bg-[#f4ded5] px-3 text-[#ba1a1a] hover:bg-[#f0d5c8]" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
              <XCircle size={13} />
              {t("owner.manage.reject")}
            </Button>
            <Button onClick={() => onApprove(refundRequest)} className="h-9 rounded-xl border-0 px-3" style={{ background: "#a04100", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
              <CheckCircle2 size={13} />
              {t("owner.manage.approveRefund")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({
  form,
  onChange,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  form: SettingsForm;
  onChange: React.Dispatch<React.SetStateAction<SettingsForm>>;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const [scheduleDraft, setScheduleDraft] = useState<SettingsForm["weeklySchedule"][number]>(createWeeklyScheduleEntry());

  useEffect(() => {
    setScheduleDraft(form.weeklySchedule[0] ?? createWeeklyScheduleEntry());
  }, [form.weeklySchedule]);

  const updateWeeklyScheduleItem = (
    index: number,
    key: keyof SettingsForm["weeklySchedule"][number],
    value: number | string
  ) => {
    onChange((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addWeeklyScheduleItem = () => {
    onChange((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.some((item) => item.dayOfWeek === scheduleDraft.dayOfWeek)
        ? prev.weeklySchedule.map((item) =>
            item.dayOfWeek === scheduleDraft.dayOfWeek ? { ...scheduleDraft } : item
          )
        : [...prev.weeklySchedule, { ...scheduleDraft }],
    }));
  };

  const removeWeeklyScheduleItem = (index: number) => {
    onChange((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const firstRange = scheduleDraft;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-[24px] border bg-white p-6" style={{ borderColor: "#dfc0b3" }}>
        <div className="mb-5">
          <p className="text-[#a04100] uppercase tracking-[0.18em]" style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700 }}>
            Venue Settings
          </p>
          <h3 className="mt-1 text-[#241914]" style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 700 }}>
            {t("owner.manage.editTitle")}
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.name")}</Label>
            <Input value={form.name} onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.location")}</Label>
            <Input value={form.location} onChange={(e) => onChange((prev) => ({ ...prev, location: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.slotPrice")}</Label>
            <Input type="number" value={form.slotPrice} onChange={(e) => onChange((prev) => ({ ...prev, slotPrice: Number(e.target.value) || 0 }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.slotDuration")}</Label>
            <Input type="number" value={form.slotDurationMinutes} onChange={(e) => onChange((prev) => ({ ...prev, slotDurationMinutes: Number(e.target.value) || 60 }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.activeDay")}</Label>
            <select value={firstRange.dayOfWeek} onChange={(e) => setScheduleDraft((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))} className="h-11 w-full rounded-xl border px-3" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}>
              {DAY_VALUES.map((day) => <option key={day} value={day}>{t(`owner.days.${day}`)}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.timeRange")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={firstRange.startTime} onChange={(e) => setScheduleDraft((prev) => ({ ...prev, startTime: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
              <Input type="time" value={firstRange.endTime} onChange={(e) => setScheduleDraft((prev) => ({ ...prev, endTime: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
            </div>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("owner.manage.fields.description")}</Label>
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 700, color: "#241914" }}>
                  Weekly Schedule List
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addWeeklyScheduleItem}
                  className="h-9 rounded-xl border-[#dfc0b3] text-[#584238] hover:bg-[#fff1eb]"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  <CalendarDays size={14} />
                  Add Range
                </Button>
              </div>
              {form.weeklySchedule.length ? (
                form.weeklySchedule.map((item, index) => (
                  <div
                    key={`${item.dayOfWeek}-${item.startTime}-${item.endTime}-${index}`}
                    className="rounded-2xl border p-3"
                    style={{ borderColor: "#dfc0b3", background: "#fffaf7" }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 700, color: "#241914" }}>
                        Range {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeWeeklyScheduleItem(index)}
                        className="h-8 rounded-lg px-2 text-[#a04100] hover:bg-[#fff1eb] hover:text-[#a04100]"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                      <select
                        value={item.dayOfWeek}
                        onChange={(e) => updateWeeklyScheduleItem(index, "dayOfWeek", Number(e.target.value))}
                        className="h-11 w-full rounded-xl border px-3"
                        style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif" }}
                      >
                        {DAY_VALUES.map((day) => <option key={day} value={day}>{t(`owner.days.${day}`)}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateWeeklyScheduleItem(index, "startTime", e.target.value)}
                          className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                        />
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => updateWeeklyScheduleItem(index, "endTime", e.target.value)}
                          className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-[#8b7266]" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
                  No schedule ranges yet. Add weekly schedule rows here.
                </div>
              )}
            </div>
            <textarea value={form.description} onChange={(e) => onChange((prev) => ({ ...prev, description: e.target.value }))} rows={5} className="min-h-[120px] w-full rounded-xl border px-3 py-3 outline-none transition-colors focus:border-[#006a65]" style={{ borderColor: "#dfc0b3", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#241914" }} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onSave} disabled={saving} className="h-11 rounded-xl border-0 px-5" style={{ background: "linear-gradient(90deg,#a04100,#ff7e36)", color: "#fff", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t("owner.manage.save")}
          </Button>
          <Button onClick={onDelete} disabled={deleting} variant="outline" className="h-11 rounded-xl border-[#f0c5c5] bg-[#fff] px-5 text-[#ba1a1a] hover:bg-[#fff3f3]" style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {t("owner.manage.deleteVenue")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[24px] border bg-white p-5" style={{ borderColor: "#dfc0b3" }}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "#dfc0b3", background: "#fff1eb" }}>
            <Sparkles size={14} className="text-[#a04100]" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: "#a04100", textTransform: "uppercase", letterSpacing: "0.18em" }}>
              Preview
            </span>
          </div>
          <h4 style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>{form.name || t("owner.manage.fields.name")}</h4>
          <p className="mt-2" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238", lineHeight: 1.6 }}>{form.description || t("owner.manage.previewDescription")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3" style={{ background: "#fef4ef" }}>
              <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "16px", fontWeight: 700, color: "#241914" }}>{formatPrice(form.slotPrice || 0, locale)}</p>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238" }}>{t("owner.manage.perSlot")}</span>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#eefbf7" }}>
              <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "16px", fontWeight: 700, color: "#241914" }}>{t("owner.manage.minutes", { count: form.slotDurationMinutes })}</p>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238" }}>{t("owner.manage.duration")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VenueManagePage() {
  const { t, i18n } = useTranslation("matching");
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();

  const [venue, setVenue] = useState<OwnerVenue | null>(null);
  const [settingsForm, setSettingsForm] = useState<SettingsForm | null>(null);
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [refundRequests, setRefundRequests] = useState<OwnerRefundRequest[]>([]);
  const [slots, setSlots] = useState<OwnerSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const dateTabs = Array.from({ length: 7 }, (_, i) => addDays(addDays(today, weekOffset * 7), i));
  const selectedDateStr = toISO(dateTabs[dayIdx]);

  const loadVenue = useCallback(async () => {
    if (!venueId) return;
    const items = await fetchOwnerVenues();
    const currentVenue = items.find((item) => item.id === venueId) || null;
    setVenue(currentVenue);
    if (currentVenue) setSettingsForm(toSettingsForm(currentVenue));
  }, [venueId]);

  const loadBookingsAndRefunds = useCallback(async () => {
    if (!venueId) return;
    const [bookingData, refundData] = await Promise.all([
      fetchOwnerVenueBookings(venueId, { date: selectedDateStr }),
      fetchOwnerRefundRequests(venueId, { status: "pending_manual" }),
    ]);
    setBookings(bookingData.items);
    setRefundRequests(refundData);
  }, [venueId, selectedDateStr]);

  const loadSlots = useCallback(async () => {
    if (!venueId) return;
    const slotData = await fetchVenueSlotsByDate(venueId, selectedDateStr);
    setSlots(slotData.slots);
  }, [venueId, selectedDateStr]);

  useEffect(() => {
    const load = async () => {
      if (!venueId) return;
      try {
        setLoading(true);
        await Promise.all([loadVenue(), loadBookingsAndRefunds(), loadSlots()]);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || t("owner.manage.loadError"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [venueId, loadVenue, loadBookingsAndRefunds, loadSlots]);

  useEffect(() => {
    if (!venueId) return;
    loadBookingsAndRefunds().catch(() => undefined);
    loadSlots().catch(() => undefined);
  }, [selectedDateStr, venueId, loadBookingsAndRefunds, loadSlots]);

  const handleSlotAction = async (slot: OwnerSlot, action: SlotAction) => {
    if (!venueId) return;
    try {
      await updateOwnerAvailability(venueId, {
        date: selectedDateStr,
        start_time: slot.startTime,
        end_time: slot.endTime,
        status: action === "open" ? "available" : "unavailable",
      });
      await loadSlots();
      toast.success(action === "open" ? t("owner.manage.slotOpened", { time: slot.startTime }) : t("owner.manage.slotBlocked", { time: slot.startTime }));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.manage.slotUpdateError"));
    }
  };

  const handleSaveSettings = async () => {
    if (!venueId || !settingsForm) return;
    try {
      setSaving(true);
      const payload: UpdateVenuePayload = {
        name: settingsForm.name,
        location: settingsForm.location,
        description: settingsForm.description,
      };
      await updateOwnerVenue(venueId, payload);
      await updateOwnerVenueSchedule(venueId, {
        slot_price: settingsForm.slotPrice,
        slot_duration_minutes: settingsForm.slotDurationMinutes,
        weekly_schedule: settingsForm.weeklySchedule.map((item) => ({
          day_of_week: item.dayOfWeek,
          start_time: item.startTime,
          end_time: item.endTime,
        })),
      });
      await loadVenue();
      await loadSlots();
      toast.success(t("owner.manage.updateSuccess"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.manage.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVenue = async () => {
    if (!venue) return;
    const confirmed = window.confirm(t("owner.manage.deleteConfirm", { name: venue.name }));
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteOwnerVenue(venue.id);
      toast.success(t("owner.manage.deleteSuccess", { name: venue.name }));
      navigate("/owner/venues");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.manage.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const handleResolveRefund = async (refund: OwnerRefundRequest, action: "approve" | "reject") => {
    try {
      await resolveOwnerRefund(refund.id, { action });
      await loadBookingsAndRefunds();
      await loadSlots();
      toast.success(action === "approve" ? t("owner.manage.refundApproved") : t("owner.manage.refundRejected"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.manage.refundError"));
    }
  };

  const summary = useMemo(() => {
    const confirmedCount = bookings.filter((booking) => booking.status === "confirmed").length;
    const refundingCount = bookings.filter((booking) => booking.status === "refund_processing").length;
    const manualRefundCount = refundRequests.filter((refund) => refund.status === "pending_manual").length;
    const revenue = bookings.filter((booking) => booking.status === "confirmed").reduce((sum, booking) => sum + booking.amount, 0);
    return { confirmedCount, refundingCount, manualRefundCount, revenue };
  }, [bookings, refundRequests]);

  const refundMap = useMemo(() => new Map(refundRequests.map((refund) => [refund.bookingId, refund])), [refundRequests]);

  const tabs = [
    { id: "bookings" as Tab, icon: <ClipboardList size={16} />, label: `Bookings (${bookings.length})` },
    { id: "schedule" as Tab, icon: <CalendarDays size={16} />, label: t("owner.manage.tabs.schedule") },
    { id: "settings" as Tab, icon: <Settings2 size={16} />, label: t("owner.manage.tabs.settings") },
  ];

  if (loading || !venue || !settingsForm) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#a04100" }} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#fff8f6]">
      <div className="relative overflow-hidden" style={{ height: 260 }}>
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#ffd9c6] to-[#fff1eb] text-8xl">🏟️</div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.08),rgba(36,25,20,0.78))" }} />
        <div className="absolute left-6 right-6 top-5 flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="h-10 rounded-xl border-white/30 bg-white/10 px-4 text-white hover:bg-white/20">
            <Link to="/owner/venues">
              <ArrowLeft size={16} />
              Venues
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.14)" }}>
            <Sparkles size={14} className="text-white" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Owner Venue Studio
            </span>
          </div>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 style={{ fontFamily: "Lexend, sans-serif", fontSize: "30px", fontWeight: 800, color: "#fff" }}>{venue.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif", fontSize: "13px" }} className="inline-flex items-center gap-1">
              <MapPin size={12} /> {venue.location}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif", fontSize: "13px" }} className="inline-flex items-center gap-1">
              <Users size={12} /> {t("owner.manage.rangesPerWeek", { count: venue.weeklySchedule.length })}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-10 max-w-screen-xl px-6 pb-8">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Bookings", value: bookings.length, color: "#241914", icon: <ClipboardList size={16} /> },
            { label: "Confirmed", value: summary.confirmedCount, color: "#006a65", icon: <CheckCircle2 size={16} /> },
            { label: "Manual Refund", value: summary.manualRefundCount, color: "#856404", icon: <AlertTriangle size={16} /> },
            { label: "Revenue", value: formatPrice(summary.revenue, locale), color: "#a04100", icon: <Wallet size={16} /> },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border bg-white p-5" style={{ borderColor: "#dfc0b3", boxShadow: "0 14px 30px rgba(36,25,20,0.06)" }}>
              <div className="mb-2 text-[#8b7266]">{item.icon}</div>
              <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 800, color: item.color }}>{item.value}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266", marginTop: 4 }}>{item.label}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[28px] border bg-white" style={{ borderColor: "#dfc0b3", boxShadow: "0 20px 40px rgba(36,25,20,0.06)" }}>
          <div className="flex flex-wrap border-b px-6" style={{ borderColor: "#dfc0b3", background: "#fff" }}>
            {tabs.map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className="flex items-center gap-2 px-4 py-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? "#a04100" : "#584238", borderBottom: tab === item.id ? "2.5px solid #a04100" : "2.5px solid transparent", marginBottom: -1 }}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "bookings" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#584238" }}>
                    {bookings.length === 0 ? t("owner.manage.noVenueBookings") : t("owner.manage.bookingsForDate", { count: bookings.length, date: selectedDateStr })}
                  </p>
                  {summary.manualRefundCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "#fff1eb", color: "#a04100", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                      <ClipboardList size={12} /> {t("owner.manage.manualRequestCount", { count: summary.manualRefundCount })}
                    </span>
                  )}
                </div>

                {bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed py-16" style={{ borderColor: "#dfc0b3" }}>
                    <CalendarDays size={48} style={{ color: "#dfc0b3", marginBottom: 12 }} />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#8b7266" }}>{t("owner.manage.noBookings")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {bookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} refundRequest={refundMap.get(booking.id)} onApprove={(refund) => handleResolveRefund(refund, "approve")} onReject={(refund) => handleResolveRefund(refund, "reject")} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "schedule" && (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-[24px] border" style={{ background: "#fff", borderColor: "#dfc0b3" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "#f4ded5" }}>
                    <div>
                      <h3 style={{ fontFamily: "Lexend, sans-serif", fontSize: "18px", fontWeight: 700, color: "#241914" }}>{t("owner.manage.scheduleTitle")}</h3>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8b7266", marginTop: 4 }}>
                        {t("owner.manage.scheduleSubtitle")}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="mb-5 flex items-center gap-2">
                      <button onClick={() => { setWeekOffset((value) => value - 1); setDayIdx(0); }} disabled={weekOffset <= 0} className="rounded-lg p-1.5 hover:bg-[#fff1eb] disabled:opacity-30" style={{ color: "#584238" }}>
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                        {dateTabs.map((date, index) => {
                          const isToday = weekOffset === 0 && index === 0;
                          const isSelected = index === dayIdx;
                          return (
                            <button key={index} onClick={() => setDayIdx(index)} className="flex min-w-[72px] shrink-0 flex-col items-center rounded-xl px-3 py-2" style={{ background: isSelected ? "#a04100" : "#fff", border: `1.5px solid ${isSelected ? "#a04100" : "#dfc0b3"}` }}>
                              <span style={{ fontFamily: "Lexend, sans-serif", fontSize: "11px", fontWeight: 600, color: isSelected ? "#fff" : "#8b7266", textTransform: "uppercase" }}>
                                {isToday ? t("owner.manage.today") : date.toLocaleDateString(locale, { weekday: "short" })}
                              </span>
                              <span style={{ fontFamily: "Lexend, sans-serif", fontSize: "18px", fontWeight: 800, color: isSelected ? "#fff" : "#241914", lineHeight: 1.1 }}>{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={() => { setWeekOffset((value) => value + 1); setDayIdx(0); }} className="rounded-lg p-1.5 hover:bg-[#fff1eb]" style={{ color: "#584238" }}>
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {slots.map((slot) => {
                        const isUnavailable = slot.status === "unavailable";
                        const isBooked = slot.status === "booked" || slot.status === "held" || slot.status === "refund_processing";
                        const isAvailable = slot.status === "available";
                        const bg = isUnavailable ? "#f4ded5" : isBooked ? "#e7f8f7" : "#fff";
                        const border = isUnavailable ? "#dfc0b3" : isBooked ? "#7de0cc" : "#dfc0b3";
                        const color = isUnavailable ? "#8b7266" : isBooked ? "#006a65" : "#241914";

                        return (
                          <button key={`${slot.startTime}-${slot.endTime}`} onClick={() => isAvailable ? handleSlotAction(slot, "unavailable") : isUnavailable ? handleSlotAction(slot, "open") : undefined} disabled={!isAvailable && !isUnavailable} className="flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all disabled:cursor-not-allowed disabled:opacity-70" style={{ background: bg, borderColor: border }}>
                            <span style={{ fontFamily: "Lexend, sans-serif", fontSize: "14px", fontWeight: 700, color }}>{slot.startTime}</span>
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color }}>{slot.status}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "#f4ded5" }}>
                      <Button onClick={async () => { for (const slot of slots.filter((item) => item.status === "available")) { await updateOwnerAvailability(venue.id, { date: selectedDateStr, start_time: slot.startTime, end_time: slot.endTime, status: "unavailable" }); } await loadSlots(); toast.success(t("owner.manage.blockAllSuccess")); }} className="h-9 rounded-xl border-0 px-3" style={{ background: "#856404", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                        <Ban size={12} /> Block all available
                      </Button>
                      <Button onClick={async () => { for (const slot of slots.filter((item) => item.status === "unavailable")) { await updateOwnerAvailability(venue.id, { date: selectedDateStr, start_time: slot.startTime, end_time: slot.endTime, status: "available" }); } await loadSlots(); toast.success(t("owner.manage.openAllSuccess")); }} className="h-9 rounded-xl border-0 px-3" style={{ background: "#006a65", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                        <LockOpen size={12} /> Open all unavailable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <SettingsTab
                form={settingsForm}
                onChange={(action) =>
                  setSettingsForm((current) => {
                    if (!current) return current;
                    return typeof action === "function" ? action(current) : action;
                  })
                }
                onSave={handleSaveSettings}
                onDelete={handleDeleteVenue}
                saving={saving}
                deleting={deleting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
