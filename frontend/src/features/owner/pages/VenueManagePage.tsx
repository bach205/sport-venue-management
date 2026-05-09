import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Settings2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Star,
  MapPin,
  Users,
} from "lucide-react";
import { fetchVenueById, generateSlots } from "../../venues/api/venuesApi";
import {
  getBookings,
  requestRefund,
  ownerApproveRefund,
  getRefundWindowRemaining,
  REFUND_WINDOW_MS,
} from "../../venues/store/bookingStore";
import {
  getOverridesForVenueDate,
  setSlotOverride,
  clearSlotOverride,
  subscribeOwner,
  type SlotOverride,
} from "../store/ownerStore";
import type { Venue, VenueSlot, Booking } from "../../venues/types/venues.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { toast } from "sonner";

type Tab = "bookings" | "schedule" | "settings";

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function formatCountdown(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function addDays(b: Date, n: number) {
  const d = new Date(b);
  d.setDate(d.getDate() + n);
  return d;
}
function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

const SPORT_EMOJI: Record<string, string> = {
  tennis: "🎾",
  basketball: "🏀",
  badminton: "🏸",
  football: "⚽",
  pickleball: "🏓",
  volleyball: "🏐",
};

// ─── Booking Status Chip ─────────────────────────────────────────────────────
function StatusChip({ status }: { status: Booking["status"] }) {
  const MAP = {
    confirmed: { bg: "#e7f8f7", color: "#006a65", label: "Confirmed" },
    processing_refund: { bg: "#fff3cd", color: "#856404", label: "Refunding" },
    refunded: { bg: "#f4ded5", color: "#8b7266", label: "Refunded" },
    cancelled: { bg: "#f4ded5", color: "#8b7266", label: "Cancelled" },
  };
  const s = MAP[status];
  return (
    <span
      className="px-2.5 py-1 rounded-full"
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: "Inter, sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Booking Card (owner view) ────────────────────────────────────────────────
function OwnerBookingCard({
  booking,
  onAutoRefund,
  onManualRefund,
  onRejectRefund,
}: {
  booking: Booking;
  onAutoRefund: (b: Booking) => void;
  onManualRefund: (b: Booking) => void;
  onRejectRefund: (b: Booking) => void;
}) {
  const [remaining, setRemaining] = useState(() => getRefundWindowRemaining(booking));
  const [actLoading, setActLoading] = useState<"auto" | "manual" | "reject" | null>(null);

  useEffect(() => {
    if (remaining <= 0 || booking.status !== "confirmed") return;
    const t = setInterval(() => {
      const r = getRefundWindowRemaining(booking);
      setRemaining(r);
      if (r <= 0) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [booking]);

  const isAutoWindow = booking.status === "confirmed" && remaining > 0;
  const canManualRefund = booking.status === "confirmed" && remaining <= 0;
  const isRefunding = booking.status === "processing_refund";

  const handleAuto = async () => {
    setActLoading("auto");
    await new Promise((r) => setTimeout(r, 800));
    onAutoRefund(booking);
    setActLoading(null);
  };
  const handleManual = async () => {
    setActLoading("manual");
    await new Promise((r) => setTimeout(r, 800));
    onManualRefund(booking);
    setActLoading(null);
  };
  const handleReject = async () => {
    setActLoading("reject");
    await new Promise((r) => setTimeout(r, 600));
    onRejectRefund(booking);
    setActLoading(null);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #dfc0b3" }}
    >
      <div className="flex items-start gap-4 p-4 border-b border-[#f4ded5]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: "#fff1eb" }}
        >
          {SPORT_EMOJI[booking.sport]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "#241914",
              }}
            >
              {booking.playerName} · #{booking.id.slice(-6).toUpperCase()}
            </p>
            <StatusChip status={booking.status} />
          </div>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#584238",
              marginTop: 2,
            }}
          >
            📅 {formatDate(booking.date)} &nbsp;|&nbsp; ⏰{" "}
            {booking.slots.map((s) => s.startTime).join(", ")}
          </p>
          {booking.notes && (
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "#8b7266",
                marginTop: 2,
                fontStyle: "italic",
              }}
            >
              "{booking.notes}"
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "16px",
              fontWeight: 800,
              color: "#a04100",
            }}
          >
            {formatPrice(booking.totalPrice)}
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              color: "#8b7266",
              textTransform: "capitalize",
            }}
          >
            via {booking.paymentMethod}
          </p>
        </div>
      </div>

      {/* Auto-refund window */}
      {isAutoWindow && (
        <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "#e7f8f7" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "#006a65" }} />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#006a65",
                  fontWeight: 500,
                }}
              >
                Auto-refund window
              </span>
            </div>
            <span
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "16px",
                fontWeight: 800,
                color: remaining < 60000 ? "#ba1a1a" : "#006a65",
              }}
            >
              {formatCountdown(remaining)}
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 5, background: "rgba(0,0,0,0.1)" }}
          >
            <div
              style={{
                height: "100%",
                width: `${((REFUND_WINDOW_MS - remaining) / REFUND_WINDOW_MS) * 100}%`,
                borderRadius: "9999px",
                background: remaining < 60000 ? "#ba1a1a" : "#006a65",
                transition: "width 0.5s",
              }}
            />
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#006a65" }}>
            Nếu khách yêu cầu, bạn có thể <strong>tự động hoàn tiền</strong> ngay lập tức trong cửa
            sổ này.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAuto}
              disabled={actLoading !== null}
              className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: "#006a65",
                color: "#fff",
                border: "none",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
              }}
            >
              {actLoading === "auto" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              Approve Auto Refund
            </button>
          </div>
        </div>
      )}

      {/* Manual refund (> 5 min) */}
      {canManualRefund && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: "#fff3cd" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: "#856404" }} />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#856404",
                fontWeight: 500,
              }}
            >
              Yêu cầu hoàn tiền thủ công (quá 5 phút)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={actLoading !== null}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl"
              style={{
                background: "#f4ded5",
                color: "#ba1a1a",
                border: "1px solid #e8c4b3",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {actLoading === "reject" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <XCircle size={13} />
              )}
              Từ chối
            </button>
            <button
              onClick={handleManual}
              disabled={actLoading !== null}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl"
              style={{
                background: "#a04100",
                color: "#fff",
                border: "none",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {actLoading === "manual" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              Duyệt Hoàn Tiền
            </button>
          </div>
        </div>
      )}

      {/* Processing refund */}
      {isRefunding && (
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#fff3cd" }}>
          <Loader2 size={14} className="animate-spin" style={{ color: "#856404" }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#856404" }}>
            Đang hoàn tiền — {formatPrice(booking.totalPrice)} sẽ về tài khoản khách trong 1–3 ngày.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Owner Slot Grid ──────────────────────────────────────────────────────────
type SlotAction = "lock" | "unavailable" | "open";

function OwnerSlotGrid({
  venueId,
  date,
  onAction,
  triggerRefresh,
}: {
  venueId: string;
  date: string;
  onAction: (startTime: string, action: SlotAction) => void;
  triggerRefresh: number;
}) {
  const [slots, setSlots] = useState<VenueSlot[]>([]);
  const [overrides, setOverrides] = useState<Map<string, SlotOverride>>(new Map());
  const [contextMenu, setContextMenu] = useState<{
    startTime: string;
    x: number;
    y: number;
  } | null>(null);

  const load = useCallback(() => {
    setSlots(generateSlots(venueId, date));
    setOverrides(getOverridesForVenueDate(venueId, date));
  }, [venueId, date]);

  useEffect(() => {
    load();
  }, [load, triggerRefresh]);
  useEffect(() => subscribeOwner(load), [load]);

  const handleSlotClick = (slot: VenueSlot, e: React.MouseEvent) => {
    e.preventDefault();
    if (slot.status === "closed") return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ startTime: slot.startTime, x: rect.left, y: rect.bottom + 4 });
  };

  const handleAction = (action: SlotAction) => {
    if (!contextMenu) return;
    onAction(contextMenu.startTime, action);
    setContextMenu(null);
  };

  const getSlotDisplay = (slot: VenueSlot) => {
    const override = overrides.get(slot.startTime);
    if (override === "locked")
      return {
        bg: "#241914",
        border: "#241914",
        label: "🔒 Locked",
        color: "#fff",
        textColor: "#fff",
      };
    if (override === "unavailable")
      return {
        bg: "#f4ded5",
        border: "#dfc0b3",
        label: "⚠️ Unavail.",
        color: "#8b7266",
        textColor: "#8b7266",
      };
    if (slot.status === "booked")
      return {
        bg: "#e7f8f7",
        border: "#7de0cc",
        label: "✅ Booked",
        color: "#006a65",
        textColor: "#006a65",
      };
    if (slot.status === "closed")
      return {
        bg: "#f7f0ed",
        border: "#dfc0b3",
        label: "⛔ Closed",
        color: "#c0a090",
        textColor: "#c0a090",
      };
    return {
      bg: "#fff",
      border: "#dfc0b3",
      label: formatPrice(slot.price),
      color: "#a04100",
      textColor: "#241914",
    };
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {slots.map((slot) => {
          const d = getSlotDisplay(slot);
          const isClosed = slot.status === "closed";
          return (
            <button
              key={slot.id}
              onClick={(e) => !isClosed && handleSlotClick(slot, e)}
              disabled={isClosed}
              className="rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all border-2"
              style={{
                height: 64,
                background: d.bg,
                borderColor: d.border,
                cursor: isClosed ? "not-allowed" : "pointer",
              }}
              title={isClosed ? "Past slot" : "Click to manage"}
            >
              <span
                style={{
                  fontFamily: "Lexend, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: d.textColor,
                }}
              >
                {slot.startTime}
              </span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: d.color }}>
                {d.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-40 rounded-xl overflow-hidden shadow-xl"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 180),
              background: "#fff",
              border: "1.5px solid #dfc0b3",
              width: 190,
              boxShadow: "0 8px 24px rgba(36,25,20,0.2)",
            }}
          >
            <div className="px-4 py-2.5 border-b border-[#f4ded5]">
              <p
                style={{
                  fontFamily: "Lexend, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#241914",
                }}
              >
                Slot {contextMenu.startTime}
              </p>
            </div>
            {[
              {
                action: "lock" as SlotAction,
                icon: <Lock size={14} />,
                label: "Khoá slot",
                color: "#241914",
                bg: "#fff",
              },
              {
                action: "unavailable" as SlotAction,
                icon: <Ban size={14} />,
                label: "Đánh dấu Unavailable",
                color: "#856404",
                bg: "#fff",
              },
              {
                action: "open" as SlotAction,
                icon: <LockOpen size={14} />,
                label: "Mở lại slot",
                color: "#006a65",
                bg: "#fff",
              },
            ].map((item) => (
              <button
                key={item.action}
                onClick={() => handleAction(item.action)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#fff1eb] transition-colors text-left"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: item.color,
                  fontWeight: 500,
                  background: item.bg,
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ venue }: { venue: Venue }) {
  const [form, setForm] = useState({
    name: venue.name,
    description: venue.description,
    openHours: venue.openHours,
    priceFrom: venue.priceFrom,
    fullAddress: venue.fullAddress,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 700));
    setSaved(true);
    toast.success("Cập nhật thông tin sân thành công!");
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid #dfc0b3",
    borderRadius: 10,
    padding: "10px 14px",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    color: "#241914",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        color: "#241914",
        display: "block",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <Label>Tên sân</Label>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onFocus={(e) => {
            e.target.style.borderColor = "#006a65";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#dfc0b3";
          }}
        />
      </div>
      <div>
        <Label>Địa chỉ đầy đủ</Label>
        <input
          style={inputStyle}
          value={form.fullAddress}
          onChange={(e) => setForm((f) => ({ ...f, fullAddress: e.target.value }))}
          onFocus={(e) => {
            e.target.style.borderColor = "#006a65";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#dfc0b3";
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Giờ mở cửa</Label>
          <input
            style={inputStyle}
            value={form.openHours}
            onChange={(e) => setForm((f) => ({ ...f, openHours: e.target.value }))}
            placeholder="06:00 – 22:00"
            onFocus={(e) => {
              e.target.style.borderColor = "#006a65";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#dfc0b3";
            }}
          />
        </div>
        <div>
          <Label>Giá từ (₫/giờ)</Label>
          <input
            style={inputStyle}
            type="number"
            value={form.priceFrom}
            onChange={(e) => setForm((f) => ({ ...f, priceFrom: Number(e.target.value) }))}
            onFocus={(e) => {
              e.target.style.borderColor = "#006a65";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#dfc0b3";
            }}
          />
        </div>
      </div>
      <div>
        <Label>Mô tả</Label>
        <textarea
          style={{ ...inputStyle, resize: "none" }}
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          onFocus={(e) => {
            e.target.style.borderColor = "#006a65";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#dfc0b3";
          }}
        />
      </div>
      <button
        onClick={handleSave}
        className="self-start flex items-center gap-2 h-11 px-6 rounded-xl transition-opacity hover:opacity-90"
        style={{
          background: "linear-gradient(90deg,#a04100,#ff7e36)",
          fontFamily: "Lexend, sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 14px rgba(160,65,0,0.3)",
        }}
      >
        {saved ? (
          <>
            <CheckCircle2 size={16} /> Đã lưu!
          </>
        ) : (
          "Lưu thay đổi"
        )}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VenueManagePage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotRefresh, setSlotRefresh] = useState(0);

  // Date picker for schedule
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const dateTabs = Array.from({ length: 7 }, (_, i) => addDays(addDays(today, weekOffset * 7), i));
  const selectedDateStr = toISO(dateTabs[dayIdx]);

  // Load venue
  useEffect(() => {
    if (!venueId) return;
    fetchVenueById(venueId).then((r) => setVenue(r.data));
  }, [venueId]);

  // Load bookings
  const refreshBookings = useCallback(() => {
    if (!venueId) return;
    setBookings(getBookings().filter((b) => b.venueId === venueId));
  }, [venueId]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);
  useEffect(() => {
    const t = setInterval(refreshBookings, 5000);
    return () => clearInterval(t);
  }, [refreshBookings]);

  // Slot actions
  const handleSlotAction = (startTime: string, action: SlotAction) => {
    if (!venueId) return;
    if (action === "open") {
      clearSlotOverride(venueId, selectedDateStr, startTime);
      toast.success(`Slot ${startTime} đã được mở lại`);
    } else {
      setSlotOverride(
        venueId,
        selectedDateStr,
        startTime,
        action === "lock" ? "locked" : "unavailable"
      );
      toast.success(`Slot ${startTime} → ${action === "lock" ? "🔒 Khoá" : "⚠️ Unavailable"}`);
    }
    setSlotRefresh((n) => n + 1);
  };

  // Booking refund actions
  const handleAutoRefund = (b: Booking) => {
    const updated = requestRefund(b.id);
    if (updated) {
      toast.success(`Hoàn tiền tự động thành công — ${formatPrice(b.totalPrice)}`);
      refreshBookings();
    } else {
      toast.error("Cửa sổ hoàn tiền đã hết hạn");
    }
  };

  const handleManualRefund = (b: Booking) => {
    const updated = ownerApproveRefund(b.id);
    if (updated) {
      toast.success(`Đã duyệt hoàn tiền thủ công — ${formatPrice(b.totalPrice)}`);
    } else {
      toast.error("Không thể duyệt hoàn tiền cho booking này");
    }
    refreshBookings();
  };

  const handleRejectRefund = (b: Booking) => {
    toast.info(`Đã từ chối yêu cầu hoàn tiền cho #${b.id.slice(-6).toUpperCase()}`);
  };

  const TABS = [
    {
      id: "bookings" as Tab,
      icon: <ClipboardList size={16} />,
      label: `Bookings (${bookings.length})`,
    },
    { id: "schedule" as Tab, icon: <CalendarDays size={16} />, label: "Lịch & Slots" },
    { id: "settings" as Tab, icon: <Settings2 size={16} />, label: "Cài đặt sân" },
  ];

  if (!venue) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#a04100" }} />
      </div>
    );
  }

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const refundingCount = bookings.filter((b) => b.status === "processing_refund").length;

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#fff8f6" }}>
      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: 200 }}>
        <ImageWithFallback
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.1),rgba(36,25,20,0.75))" }}
        />
        <button
          onClick={() => navigate("/owner/venues")}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <ArrowLeft size={16} /> Venues
        </button>
        <div className="absolute bottom-5 left-6 right-6">
          <h1
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "24px",
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {venue.name}
          </h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span
              className="flex items-center gap-1"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
              }}
            >
              <MapPin size={12} /> {venue.shortAddress}
            </span>
            <span
              className="flex items-center gap-1"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
              }}
            >
              <Star size={12} fill="#ffcc00" color="#ffcc00" /> {venue.rating} ({venue.reviewCount})
            </span>
            <span
              className="flex items-center gap-1"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
              }}
            >
              <Users size={12} /> {venue.courtCount} courts
            </span>
          </div>
        </div>
      </div>

      {/* Mini stats bar */}
      <div className="flex border-b border-[#dfc0b3]" style={{ background: "#fff" }}>
        {[
          { label: "Total Bookings", value: bookings.length, color: "#241914" },
          { label: "Confirmed", value: confirmedCount, color: "#006a65" },
          { label: "Refunding", value: refundingCount, color: "#856404" },
          {
            label: "Revenue",
            value: formatPrice(
              bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0)
            ),
            color: "#a04100",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="flex-1 px-4 py-3 text-center border-r border-[#f4ded5] last:border-r-0"
          >
            <p
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "18px",
                fontWeight: 800,
                color: s.color,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                color: "#8b7266",
                marginTop: 1,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#dfc0b3] px-6" style={{ background: "#fff" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-3.5 relative transition-colors"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? "#a04100" : "#584238",
              borderBottom: tab === t.id ? "2.5px solid #a04100" : "2.5px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-screen-xl mx-auto w-full px-6 py-6">
        {/* ─── Bookings Tab ─── */}
        {tab === "bookings" && (
          <div className="flex flex-col gap-4">
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#584238" }}>
                {bookings.length === 0
                  ? "Chưa có booking nào cho sân này"
                  : `${bookings.length} booking${bookings.length > 1 ? "s" : ""} tổng cộng`}
              </p>
              {refundingCount > 0 && (
                <span
                  className="px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{
                    background: "#fff3cd",
                    color: "#856404",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <AlertTriangle size={12} />
                  {refundingCount} cần xử lý
                </span>
              )}
            </div>

            {bookings.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-2xl"
                style={{ background: "#fff", border: "1.5px dashed #dfc0b3" }}
              >
                <CalendarDays size={48} style={{ color: "#dfc0b3", marginBottom: 12 }} />
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#8b7266" }}>
                  Chưa có booking nào
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {bookings.map((b) => (
                  <OwnerBookingCard
                    key={b.id}
                    booking={b}
                    onAutoRefund={handleAutoRefund}
                    onManualRefund={handleManualRefund}
                    onRejectRefund={handleRejectRefund}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Schedule Tab ─── */}
        {tab === "schedule" && (
          <div className="flex flex-col gap-5">
            {/* Date picker */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #dfc0b3" }}
            >
              <div className="px-5 py-4 border-b border-[#f4ded5] flex items-center justify-between">
                <h3
                  style={{
                    fontFamily: "Lexend, sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#241914",
                  }}
                >
                  Quản lý lịch sân
                </h3>
                <span
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8b7266" }}
                >
                  Click slot để lock / mở / đánh dấu unavailable
                </span>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-5">
                  <button
                    onClick={() => {
                      setWeekOffset((w) => w - 1);
                      setDayIdx(0);
                    }}
                    disabled={weekOffset <= 0}
                    className="p-1.5 rounded-lg hover:bg-[#fff1eb] disabled:opacity-30"
                    style={{ color: "#584238" }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                    {dateTabs.map((d, i) => {
                      const isToday = weekOffset === 0 && i === 0;
                      const isSel = i === dayIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => setDayIdx(i)}
                          className="shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all"
                          style={{
                            background: isSel ? "#a04100" : "#fff",
                            border: `1.5px solid ${isSel ? "#a04100" : "#dfc0b3"}`,
                            minWidth: 68,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "Lexend, sans-serif",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: isSel ? "#fff" : "#8b7266",
                              textTransform: "uppercase",
                            }}
                          >
                            {isToday
                              ? "Hôm nay"
                              : d.toLocaleDateString("vi-VN", { weekday: "short" })}
                          </span>
                          <span
                            style={{
                              fontFamily: "Lexend, sans-serif",
                              fontSize: "18px",
                              fontWeight: 800,
                              color: isSel ? "#fff" : "#241914",
                              lineHeight: 1.1,
                            }}
                          >
                            {d.getDate()}
                          </span>
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              color: isSel ? "rgba(255,255,255,0.7)" : "#8b7266",
                            }}
                          >
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setWeekOffset((w) => w + 1);
                      setDayIdx(0);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#fff1eb]"
                    style={{ color: "#584238" }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {[
                    { bg: "#fff", border: "#dfc0b3", label: "Available" },
                    { bg: "#e7f8f7", border: "#7de0cc", label: "Booked" },
                    { bg: "#241914", border: "#241914", label: "🔒 Locked" },
                    { bg: "#f4ded5", border: "#dfc0b3", label: "⚠️ Unavail." },
                    { bg: "#f7f0ed", border: "#dfc0b3", label: "Closed" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded"
                        style={{ background: l.bg, border: `1.5px solid ${l.border}` }}
                      />
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#8b7266",
                        }}
                      >
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>

                <OwnerSlotGrid
                  venueId={venue.id}
                  date={selectedDateStr}
                  onAction={handleSlotAction}
                  triggerRefresh={slotRefresh}
                />

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#f4ded5]">
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#241914",
                      marginRight: 4,
                    }}
                  >
                    Thao tác nhanh:
                  </p>
                  <button
                    onClick={() => {
                      const slots = generateSlots(venue.id, selectedDateStr);
                      slots
                        .filter((s) => s.status === "available")
                        .forEach((s) => {
                          setSlotOverride(venue.id, selectedDateStr, s.startTime, "locked");
                        });
                      setSlotRefresh((n) => n + 1);
                      toast.success("Đã khoá tất cả slot còn trống");
                    }}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: "#241914", color: "#fff" }}
                  >
                    <Lock size={12} /> Khoá tất cả
                  </button>
                  <button
                    onClick={() => {
                      const slots = generateSlots(venue.id, selectedDateStr);
                      slots.forEach((s) =>
                        clearSlotOverride(venue.id, selectedDateStr, s.startTime)
                      );
                      setSlotRefresh((n) => n + 1);
                      toast.success("Đã mở lại tất cả slot");
                    }}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: "#006a65", color: "#fff" }}
                  >
                    <LockOpen size={12} /> Mở tất cả
                  </button>
                  <button
                    onClick={() => {
                      const slots = generateSlots(venue.id, selectedDateStr);
                      slots
                        .filter((s) => s.status === "available")
                        .forEach((s) => {
                          setSlotOverride(venue.id, selectedDateStr, s.startTime, "unavailable");
                        });
                      setSlotRefresh((n) => n + 1);
                      toast.success("Đã đánh dấu tất cả slot Unavailable");
                    }}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: "#856404", color: "#fff" }}
                  >
                    <Ban size={12} /> Mark all Unavailable
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {tab === "settings" && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "#fff", border: "1px solid #dfc0b3" }}
          >
            <h3
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                color: "#241914",
                marginBottom: 20,
              }}
            >
              Thông tin sân
            </h3>
            <SettingsTab venue={venue} />
          </div>
        )}
      </div>
    </div>
  );
}
