import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CalendarDays,
  Settings2,
  ClipboardList,
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  LockOpen,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Mail,
  MessageSquareText,
  Users,
  Save,
  Trash2,
  Sparkles,
  Wallet,
  RefreshCcw,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { uploadImage } from "@/shared/api/uploadApi";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";

type Tab = "bookings" | "refunds" | "schedule" | "settings";
type SlotAction = "unavailable" | "open";
type RefundFilter = "all" | "pending_manual" | "approved" | "rejected" | "completed";
type RefundAction = "approve" | "reject";

type SettingsForm = {
  name: string;
  province: string;
  ward: string;
  addressDetail: string;
  phoneNumber: string;
  description: string;
  imageUrl: string;
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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toSettingsForm(venue: OwnerVenue): SettingsForm {
  return {
    name: venue.name,
    province: venue.province,
    ward: venue.ward,
    addressDetail: venue.addressDetail,
    phoneNumber: venue.phoneNumber,
    description: venue.description,
    imageUrl: venue.imageUrl || "",
    slotPrice: venue.slotPrice,
    slotDurationMinutes: venue.slotDurationMinutes,
    weeklySchedule: venue.weeklySchedule.length
      ? venue.weeklySchedule
      : [createWeeklyScheduleEntry()],
  };
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation("matching");
  const map: Record<string, { bg: string; color: string; label: string }> = {
    hold: { bg: "#fff3cd", color: "#856404", label: t("venues.bookingStatuses.hold") },
    payment_pending: { bg: "#fff3cd", color: "#856404", label: t("venues.bookingStatuses.payment_pending") },
    confirmed: { bg: "#e7f8f7", color: "#006a65", label: t("venues.bookingStatuses.confirmed") },
    refund_processing: { bg: "#fff3cd", color: "#856404", label: t("venues.bookingStatuses.refund_processing") },
    refunded: { bg: "#f4ded5", color: "#8b7266", label: t("venues.bookingStatuses.refunded") },
    refund_rejected: { bg: "#fbe9e7", color: "#ba1a1a", label: t("venues.bookingStatuses.refund_rejected") },
    expired: { bg: "#f4ded5", color: "#8b7266", label: t("venues.bookingStatuses.expired") },
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
  const slotRange = booking.slots?.length
    ? booking.slots.map((slot) => `${slot.startTime}-${slot.endTime}`).join(", ")
    : `${booking.slot.startTime}-${booking.slot.endTime}`;

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
            📅 {formatDate(booking.slot.date, locale)} | ⏰ {slotRange}
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
            {booking.payment?.status || t("owner.manage.noPayment", { defaultValue: "No payment" })}
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

function RefundStatusChip({ status }: { status: string }) {
  const { t } = useTranslation("matching");
  const map: Record<string, { bg: string; color: string }> = {
    pending_manual: { bg: "#fff3cd", color: "#856404" },
    approved: { bg: "#e8f4ff", color: "#1a5fb4" },
    rejected: { bg: "#fdecea", color: "#ba1a1a" },
    completed: { bg: "#e7f8f7", color: "#006a65" },
    pending_auto: { bg: "#fff3cd", color: "#856404" },
  };
  const item = map[status] ?? { bg: "#f4ded5", color: "#8b7266" };

  return (
    <span
      className="rounded-full px-2.5 py-1"
      style={{ background: item.bg, color: item.color, fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}
    >
      {t(`owner.manage.refundUi.statuses.${status}`, { defaultValue: status.replaceAll("_", " ") })}
    </span>
  );
}

interface RefundRequestCardProps {
  refund: OwnerRefundRequest;
  locale: string;
  onProcess: (refund: OwnerRefundRequest, action: RefundAction) => void;
}

function RefundRequestCard({ refund, locale, onProcess }: RefundRequestCardProps) {
  const { t } = useTranslation("matching");
  const canProcess = refund.status === "pending_manual";

  return (
    <article className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "#dfc0b3", boxShadow: "0 14px 30px rgba(36,25,20,0.06)" }}>
      <div className="border-b p-5" style={{ borderColor: "#f4ded5", background: "linear-gradient(135deg, #fffaf7 0%, #ffffff 100%)" }}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "20px", fontWeight: 700, color: "#241914" }}>
              #{refund.id.slice(-6).toUpperCase()}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266", marginTop: 4 }}>
              {new Date(refund.createdAt).toLocaleString(locale)}
            </p>
          </div>
          <RefundStatusChip status={refund.status} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl p-3" style={{ background: "#fff1eb" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("owner.manage.refundUi.requester")}
            </p>
            <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914", marginTop: 6 }}>
              {refund.requester?.name || t("owner.manage.refundUi.unknown")}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238", marginTop: 4 }}>
              {refund.requester?.email || t("owner.manage.refundUi.noEmail")}
            </p>
          </div>

          <div className="rounded-2xl p-3" style={{ background: "#eefbf7" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("owner.manage.refundUi.booking")}
            </p>
            <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914", marginTop: 6 }}>
              #{refund.booking?.id.slice(-6).toUpperCase() || t("owner.manage.refundUi.notAvailable")}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238", marginTop: 4 }}>
              {refund.booking?.status || t("owner.manage.refundUi.unknown")}
            </p>
          </div>

          <div className="rounded-2xl p-3" style={{ background: "#f3f7ff" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("owner.manage.refundUi.payment")}
            </p>
            <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914", marginTop: 6 }}>
              {refund.payment ? formatPrice(refund.payment.amount, locale) : t("owner.manage.refundUi.notAvailable")}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#584238", marginTop: 4 }}>
              {refund.payment?.status || t("owner.manage.refundUi.unknown")}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border p-4" style={{ borderColor: "#f4ded5", background: "#fff" }}>
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText size={14} style={{ color: "#a04100" }} />
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {t("owner.manage.refundUi.ownerNote", { defaultValue: "Owner note" })}
                </p>
              </div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#241914", lineHeight: 1.7 }}>
                {refund.note || t("owner.manage.refundUi.noNote", { defaultValue: "No note attached to this refund request." })}
              </p>
            </div>

            {refund.booking && (
              <div className="rounded-2xl border p-4" style={{ borderColor: "#f4ded5", background: "#fffaf7" }}>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: "#006a65" }} />
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {t("owner.manage.refundUi.bookingSlots", { defaultValue: "Booking slots" })}
                  </p>
                </div>
                <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914" }}>
                  {formatDate(refund.booking.slot.date, locale)}
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238", marginTop: 4 }}>
                  {refund.booking.slots?.length
                    ? refund.booking.slots.map((slot) => `${slot.startTime}-${slot.endTime}`).join(", ")
                    : `${refund.booking.slot.startTime}-${refund.booking.slot.endTime}`}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: "#dfc0b3", background: "linear-gradient(180deg, #fff1eb 0%, #ffffff 100%)" }}>
            <div className="mb-4 flex items-center gap-2">
              <BadgeDollarSign size={16} style={{ color: "#a04100" }} />
              <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "16px", fontWeight: 700, color: "#241914" }}>
                {t("owner.manage.refundUi.refundAction", { defaultValue: "Refund action" })}
              </p>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: canProcess ? "#fff3cd" : "#eefbf7", color: canProcess ? "#856404" : "#006a65" }}>
                <RefreshCcw size={12} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                  {canProcess
                    ? t("owner.manage.refundUi.pendingDecision", { defaultValue: "Pending owner decision" })
                    : t("owner.manage.refundUi.alreadyProcessed", { defaultValue: "Already processed" })}
                </span>
              </div>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238", lineHeight: 1.7 }}>
                {canProcess
                  ? t("owner.manage.refundUi.pendingHelp", { defaultValue: "Review the reason, then approve to complete the refund and reopen the slot automatically, or reject to keep the booking confirmed." })
                  : t("owner.manage.refundUi.processedHelp", { defaultValue: "This request is no longer actionable. Its final state is shown above for audit purposes." })}
              </p>

              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  onClick={() => onProcess(refund, "approve")}
                  disabled={!canProcess}
                  className="h-11 w-full rounded-xl border-0"
                  style={{ background: canProcess ? "linear-gradient(90deg,#a04100,#ff7e36)" : "#dfc0b3", color: "#fff", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}
                >
                  <CheckCircle2 size={16} />
                  {t("owner.manage.refundUi.approve", { defaultValue: "Approve refund" })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onProcess(refund, "reject")}
                  disabled={!canProcess}
                  className="h-11 w-full rounded-xl border-[#f0c5c5] bg-white text-[#ba1a1a] hover:bg-[#fff3f3]"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  <XCircle size={16} />
                  {t("owner.manage.refundUi.reject", { defaultValue: "Reject refund" })}
                </Button>
              </div>

              {refund.processedAt && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>
                  {t("owner.manage.refundUi.processedAt", { defaultValue: "Processed at {{date}}", date: new Date(refund.processedAt).toLocaleString(locale) })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SettingsTab({
  form,
  onChange,
  imagePreviewUrl,
  onImageChange,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  form: SettingsForm;
  onChange: React.Dispatch<React.SetStateAction<SettingsForm>>;
  imagePreviewUrl: string;
  onImageChange: (file: File | null) => void;
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
            {t("owner.manage.settingsBadge", { defaultValue: "Venue Settings" })}
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
            <Label>{t("owner.manage.fields.province")}</Label>
            <Input value={form.province} onChange={(e) => onChange((prev) => ({ ...prev, province: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.ward")}</Label>
            <Input value={form.ward} onChange={(e) => onChange((prev) => ({ ...prev, ward: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.addressDetail")}</Label>
            <Input value={form.addressDetail} onChange={(e) => onChange((prev) => ({ ...prev, addressDetail: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("owner.manage.fields.phone")}</Label>
            <Input value={form.phoneNumber} onChange={(e) => onChange((prev) => ({ ...prev, phoneNumber: e.target.value }))} className="h-11 border-[#dfc0b3] focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("owner.manage.fields.image")}</Label>
            <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-2xl border bg-[#fffaf7]" style={{ borderColor: "#dfc0b3", height: 140 }}>
                {imagePreviewUrl || form.imageUrl ? (
                  <ImageWithFallback src={imagePreviewUrl || form.imageUrl || ""} alt={form.name || t("owner.manage.venuePreviewAlt", { defaultValue: "Venue preview" })} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl">🏟️</div>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                  className="h-11 border-[#dfc0b3] pt-2 focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                />
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>
                  {t("owner.manage.imageHint")}
                </p>
              </div>
            </div>
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
                  {t("owner.manage.scheduleListTitle", { defaultValue: "Weekly Schedule List" })}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addWeeklyScheduleItem}
                  className="h-9 rounded-xl border-[#dfc0b3] text-[#584238] hover:bg-[#fff1eb]"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  <CalendarDays size={14} />
                  {t("owner.manage.addRange", { defaultValue: "Add Range" })}
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
                        {t("owner.manage.rangeLabel", { defaultValue: "Range {{count}}", count: index + 1 })}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeWeeklyScheduleItem(index)}
                        className="h-8 rounded-lg px-2 text-[#a04100] hover:bg-[#fff1eb] hover:text-[#a04100]"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                      >
                        <Trash2 size={14} />
                        {t("owner.manage.remove", { defaultValue: "Remove" })}
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
                  {t("owner.manage.noScheduleDraft", { defaultValue: "No schedule ranges yet. Add weekly schedule rows here." })}
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
          <div className="mb-4 overflow-hidden rounded-2xl border bg-[#fffaf7]" style={{ borderColor: "#dfc0b3", height: 180 }}>
            {imagePreviewUrl || form.imageUrl ? (
              <ImageWithFallback src={imagePreviewUrl || form.imageUrl || ""} alt={form.name || t("owner.manage.venuePreviewAlt", { defaultValue: "Venue preview" })} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🏟️</div>
            )}
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "#dfc0b3", background: "#fff1eb" }}>
            <Sparkles size={14} className="text-[#a04100]" />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: "#a04100", textTransform: "uppercase", letterSpacing: "0.18em" }}>
              {t("owner.manage.preview", { defaultValue: "Preview" })}
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
  const [settingsImageFile, setSettingsImageFile] = useState<File | null>(null);
  const [settingsImagePreviewUrl, setSettingsImagePreviewUrl] = useState("");

  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [bookingDateFilter, setBookingDateFilter] = useState("");
  const [refundStatusFilter, setRefundStatusFilter] = useState<RefundFilter>("all");
  const [activeRefund, setActiveRefund] = useState<OwnerRefundRequest | null>(null);
  const [refundAction, setRefundAction] = useState<RefundAction>("approve");
  const [refundDecisionNote, setRefundDecisionNote] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);
  const dateTabs = Array.from({ length: 7 }, (_, i) => addDays(addDays(today, weekOffset * 7), i));
  const selectedDateStr = toISO(dateTabs[dayIdx]);

  const loadVenue = useCallback(async () => {
    if (!venueId) return;
    const items = await fetchOwnerVenues();
    const currentVenue = items.find((item) => item.id === venueId) || null;
    setVenue(currentVenue);
    if (currentVenue) {
      setSettingsForm(toSettingsForm(currentVenue));
      setSettingsImageFile(null);
      setSettingsImagePreviewUrl("");
    }
  }, [venueId]);

  const loadBookingsAndRefunds = useCallback(async () => {
    if (!venueId) return;
    const [bookingData, refundData] = await Promise.all([
      fetchOwnerVenueBookings(venueId, bookingDateFilter ? { date: bookingDateFilter } : undefined),
      fetchOwnerRefundRequests(venueId),
    ]);
    setBookings(bookingData.items);
    setRefundRequests(refundData.items);
  }, [venueId, bookingDateFilter]);

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
  }, [bookingDateFilter, venueId, loadBookingsAndRefunds]);

  useEffect(() => {
    if (!venueId) return;
    loadSlots().catch(() => undefined);
  }, [selectedDateStr, venueId, loadSlots]);

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
      let imageUrl = settingsForm.imageUrl || "";
      if (settingsImageFile) {
        const uploadResult = await uploadImage(settingsImageFile);
        if (!uploadResult.success || !uploadResult.data?.imageUrl) {
          throw new Error(uploadResult.message || t("owner.manage.imageUploadError"));
        }
        imageUrl = uploadResult.data.imageUrl;
      }

      const payload: UpdateVenuePayload = {
        name: settingsForm.name,
        province: settingsForm.province,
        ward: settingsForm.ward,
        address_detail: settingsForm.addressDetail,
        phone_number: settingsForm.phoneNumber,
        description: settingsForm.description,
        image_url: imageUrl,
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
      setProcessingRefund(true);
      await resolveOwnerRefund(refund.id, {
        action,
        note: refundDecisionNote.trim() || undefined,
      });
      await loadBookingsAndRefunds();
      await loadSlots();
      setActiveRefund(null);
      setRefundDecisionNote("");
      toast.success(action === "approve" ? t("owner.manage.refundApproved") : t("owner.manage.refundRejected"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("owner.manage.refundError"));
    } finally {
      setProcessingRefund(false);
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
  const filteredRefundRequests = useMemo(
    () => refundRequests.filter((refund) => refundStatusFilter === "all" || refund.status === refundStatusFilter),
    [refundRequests, refundStatusFilter]
  );

  const tabs = [
    { id: "bookings" as Tab, icon: <ClipboardList size={16} />, label: t("owner.manage.tabs.bookings", { defaultValue: "Bookings ({{count}})", count: bookings.length }) },
    { id: "refunds" as Tab, icon: <RefreshCcw size={16} />, label: t("owner.manage.tabs.refunds", { defaultValue: "Refunds ({{count}})", count: refundRequests.length }) },
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
              {t("owner.nav.venues")}
            </Link>
          </Button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 style={{ fontFamily: "Lexend, sans-serif", fontSize: "30px", fontWeight: 800, color: "#fff" }}>{venue.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif", fontSize: "13px" }} className="inline-flex items-center gap-1">
              <MapPin size={12} /> {venue.location}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
              {venue.phoneNumber}
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
            { label: t("owner.manage.stats.totalBookings", { defaultValue: "Total Bookings" }), value: bookings.length, color: "#241914", icon: <ClipboardList size={16} /> },
            { label: t("owner.manage.stats.confirmed", { defaultValue: "Confirmed" }), value: summary.confirmedCount, color: "#006a65", icon: <CheckCircle2 size={16} /> },
            { label: t("owner.manage.stats.manualRefund", { defaultValue: "Manual Refund" }), value: summary.manualRefundCount, color: "#856404", icon: <AlertTriangle size={16} /> },
            { label: t("owner.manage.stats.revenue", { defaultValue: "Revenue" }), value: formatPrice(summary.revenue, locale), color: "#a04100", icon: <Wallet size={16} /> },
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
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">

                      <Input
                        type="date"
                        value={bookingDateFilter}
                        onChange={(event) => setBookingDateFilter(event.target.value)}
                        className="h-10 w-[220px] rounded-xl border-[#dfc0b3] bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBookingDateFilter("")}
                      disabled={!bookingDateFilter}
                      className="h-10 rounded-xl border-[#dfc0b3] px-4 text-[#584238] hover:bg-[#fff1eb]"
                    >
                      {t("owner.manage.clearFilter", { defaultValue: "Clear filter" })}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    {summary.manualRefundCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: "#fff1eb", color: "#a04100", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                        <ClipboardList size={12} /> {t("owner.manage.manualRequestCount", { count: summary.manualRefundCount })}
                      </span>
                    )}
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed py-16" style={{ borderColor: "#dfc0b3" }}>
                    <CalendarDays size={48} style={{ color: "#dfc0b3", marginBottom: 12 }} />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#8b7266" }}>
                      {bookingDateFilter
                        ? t("owner.manage.noBookingsForDate", { defaultValue: "No bookings found for the selected date." })
                        : t("owner.manage.noBookings")}
                    </p>
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
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color }}>{t(`venues.status.${slot.status}`, { defaultValue: slot.status })}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "#f4ded5" }}>
                      <Button onClick={async () => { for (const slot of slots.filter((item) => item.status === "available")) { await updateOwnerAvailability(venue.id, { date: selectedDateStr, start_time: slot.startTime, end_time: slot.endTime, status: "unavailable" }); } await loadSlots(); toast.success(t("owner.manage.blockAllSuccess")); }} className="h-9 rounded-xl border-0 px-3" style={{ background: "#856404", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                        <Ban size={12} /> {t("owner.manage.blockAllAvailable", { defaultValue: "Block all available" })}
                      </Button>
                      <Button onClick={async () => { for (const slot of slots.filter((item) => item.status === "unavailable")) { await updateOwnerAvailability(venue.id, { date: selectedDateStr, start_time: slot.startTime, end_time: slot.endTime, status: "available" }); } await loadSlots(); toast.success(t("owner.manage.openAllSuccess")); }} className="h-9 rounded-xl border-0 px-3" style={{ background: "#006a65", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700 }}>
                        <LockOpen size={12} /> {t("owner.manage.openAllUnavailable", { defaultValue: "Open all unavailable" })}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "refunds" && (
              <div className="space-y-5">
                <div className="rounded-[24px] border bg-white p-5" style={{ borderColor: "#dfc0b3", boxShadow: "0 14px 30px rgba(36,25,20,0.06)" }}>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "#dfc0b3", background: "#fff1eb" }}>
                        <RefreshCcw size={14} className="text-[#a04100]" />
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 700, color: "#a04100", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                          {t("owner.manage.refundUi.badge", { defaultValue: "Refund Desk" })}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "Lexend, sans-serif", fontSize: "22px", fontWeight: 700, color: "#241914" }}>
                        {t("owner.manage.refundUi.title", { defaultValue: "Owner refund processing" })}
                      </h3>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8b7266", marginTop: 6, lineHeight: 1.7 }}>
                        {t("owner.manage.refundUi.subtitle", { defaultValue: "Review manual refund requests, inspect booking and payment state, then approve or reject directly from this venue detail page." })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "all" as RefundFilter, label: t("owner.manage.refundUi.filters.all", { defaultValue: "All ({{count}})", count: refundRequests.length }) },
                        { id: "pending_manual" as RefundFilter, label: t("owner.manage.refundUi.filters.pending", { defaultValue: "Pending ({{count}})", count: refundRequests.filter((refund) => refund.status === "pending_manual").length }) },
                        { id: "completed" as RefundFilter, label: t("owner.manage.refundUi.filters.completed", { defaultValue: "Completed ({{count}})", count: refundRequests.filter((refund) => refund.status === "completed").length }) },
                        { id: "rejected" as RefundFilter, label: t("owner.manage.refundUi.filters.rejected", { defaultValue: "Rejected ({{count}})", count: refundRequests.filter((refund) => refund.status === "rejected").length }) },
                      ].map((item) => {
                        const active = refundStatusFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setRefundStatusFilter(item.id)}
                            className="rounded-full px-3 py-2"
                            style={{
                              background: active ? "#a04100" : "#fff",
                              color: active ? "#fff" : "#584238",
                              border: `1.5px solid ${active ? "#a04100" : "#dfc0b3"}`,
                              fontFamily: "Inter, sans-serif",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {filteredRefundRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed bg-white py-16" style={{ borderColor: "#dfc0b3" }}>
                    <RefreshCcw size={44} style={{ color: "#dfc0b3", marginBottom: 12 }} />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#584238" }}>
                      {t("owner.manage.refundUi.empty", { defaultValue: "No refund requests match this filter." })}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {filteredRefundRequests.map((refund) => (
                      <RefundRequestCard
                        key={refund.id}
                        refund={refund}
                        locale={locale}
                        onProcess={(item, action) => {
                          setActiveRefund(item);
                          setRefundAction(action);
                          setRefundDecisionNote(item.note || "");
                        }}
                      />
                    ))}
                  </div>
                )}
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
                imagePreviewUrl={settingsImagePreviewUrl}
                onImageChange={(file) => {
                  setSettingsImageFile(file);
                  setSettingsImagePreviewUrl(file ? URL.createObjectURL(file) : "");
                }}
                onSave={handleSaveSettings}
                onDelete={handleDeleteVenue}
                saving={saving}
                deleting={deleting}
              />
            )}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(activeRefund)} onOpenChange={(open) => {
        if (!open) {
          setActiveRefund(null);
          setRefundDecisionNote("");
        }
      }}>
        <DialogContent className="max-w-4xl rounded-[28px] border-0 bg-white p-0">
          {activeRefund && (
            <>
              <DialogHeader className="border-b px-6 py-5" style={{ borderColor: "#f4ded5", background: "linear-gradient(135deg, #fffaf7 0%, #fff1eb 100%)" }}>
                <DialogTitle style={{ fontFamily: "Lexend, sans-serif", fontSize: "24px", fontWeight: 700, color: "#241914" }}>
                  {refundAction === "approve"
                    ? t("owner.manage.refundUi.dialogApproveTitle", { defaultValue: "Approve refund request" })
                    : t("owner.manage.refundUi.dialogRejectTitle", { defaultValue: "Reject refund request" })}
                </DialogTitle>
                <DialogDescription style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238", lineHeight: 1.7 }}>
                  {refundAction === "approve"
                    ? t("owner.manage.refundUi.dialogApproveDescription", { defaultValue: "Approving completes the refund flow and reopens the booked slot automatically." })
                    : t("owner.manage.refundUi.dialogRejectDescription", { defaultValue: "Rejecting keeps the booking confirmed and marks this request as rejected." })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl p-3" style={{ background: "#fff1eb" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("owner.manage.refundUi.requester", { defaultValue: "Requester" })}</p>
                    <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914", marginTop: 6 }}>{activeRefund.requester?.name || t("owner.manage.refundUi.unknown", { defaultValue: "Unknown" })}</p>

                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#eefbf7" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("owner.manage.refundUi.booking", { defaultValue: "Booking" })}</p>
                    <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914", marginTop: 6 }}>#{activeRefund.booking?.id.slice(-6).toUpperCase() || "N/A"}</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#f3f7ff" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#8b7266", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("owner.manage.refundUi.payment", { defaultValue: "Payment" })}</p>
                    <p style={{ fontFamily: "Lexend, sans-serif", fontSize: "15px", fontWeight: 700, color: "#241914", marginTop: 6 }}>
                      {activeRefund.payment ? formatPrice(activeRefund.payment.amount, locale) : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refund-note">{t("owner.manage.refundUi.ownerNote", { defaultValue: "Owner note" })}</Label>
                  <Textarea
                    id="refund-note"
                    value={refundDecisionNote}
                    onChange={(event) => setRefundDecisionNote(event.target.value)}
                    maxLength={500}
                    placeholder={t("owner.manage.refundUi.notePlaceholder", { defaultValue: "Add an internal note or a short explanation for the decision." })}
                    className="min-h-[120px] rounded-2xl border-[#dfc0b3] px-4 py-3 focus-visible:border-[#006a65] focus-visible:ring-[#006a65]/20"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#241914" }}
                  />
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}>
                    {refundDecisionNote.length}/500
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-3 border-t px-6 py-4 sm:justify-between" style={{ borderColor: "#f4ded5", background: "#fffaf7" }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveRefund(null);
                    setRefundDecisionNote("");
                  }}
                  className="h-11 rounded-xl border-[#dfc0b3] px-5 text-[#584238] hover:bg-white"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  {t("owner.manage.refundUi.cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button
                  type="button"
                  disabled={processingRefund}
                  onClick={() => handleResolveRefund(activeRefund, refundAction)}
                  className="h-11 rounded-xl border-0 px-5"
                  style={{ background: refundAction === "approve" ? "linear-gradient(90deg,#a04100,#ff7e36)" : "#ba1a1a", color: "#fff", fontFamily: "Lexend, sans-serif", fontWeight: 700 }}
                >
                  {processingRefund ? <Loader2 size={16} className="animate-spin" /> : refundAction === "approve" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {refundAction === "approve"
                    ? t("owner.manage.refundUi.confirmApprove", { defaultValue: "Confirm approval" })
                    : t("owner.manage.refundUi.confirmReject", { defaultValue: "Confirm rejection" })}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
