import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  CalendarDays,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Star,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getCurrentUser } from "../../auth/store/authStore";
import { MOCK_VENUES } from "../../venues/api/venuesApi";
import { getBookings, getRefundWindowRemaining } from "../../venues/store/bookingStore";
import type { Booking } from "../../venues/types/venues.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const SPORT_EMOJI: Record<string, string> = {
  tennis: "🎾",
  basketball: "🏀",
  badminton: "🏸",
  football: "⚽",
  pickleball: "🏓",
  volleyball: "🏐",
};

export default function VenueOwnerDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const ownedIds = user?.ownedVenueIds ?? [];
  const venues = MOCK_VENUES.filter((v) => ownedIds.includes(v.id));
  const [allBookings, setAllBookings] = useState<Booking[]>(() => getBookings());

  useEffect(() => {
    const t = setInterval(() => setAllBookings([...getBookings()]), 5000);
    return () => clearInterval(t);
  }, []);

  // Bookings that belong to owner's venues
  const myBookings = allBookings.filter((b) => ownedIds.includes(b.venueId));
  const confirmedBookings = myBookings.filter((b) => b.status === "confirmed");
  const pendingRefunds = myBookings.filter((b) => b.status === "processing_refund");
  const totalRevenue = myBookings
    .filter((b) => b.status === "confirmed" || b.status === "processing_refund")
    .reduce((s, b) => s + b.totalPrice, 0);

  // Bookings needing attention (refund window still open = auto-refundable)
  const autoRefundable = confirmedBookings.filter((b) => getRefundWindowRemaining(b) > 0);

  const stats = [
    {
      icon: <Building2 size={20} />,
      label: "Venues",
      value: venues.length,
      sub: "Active",
      bg: "#fff1eb",
      color: "#a04100",
    },
    {
      icon: <CalendarDays size={20} />,
      label: "Total Bookings",
      value: myBookings.length,
      sub: `${confirmedBookings.length} confirmed`,
      bg: "#e7f8f7",
      color: "#006a65",
    },
    {
      icon: <DollarSign size={20} />,
      label: "Revenue",
      value: formatPrice(totalRevenue),
      sub: "All time",
      bg: "#fff1eb",
      color: "#a04100",
      wide: true,
    },
    {
      icon: <AlertCircle size={20} />,
      label: "Pending Refunds",
      value: pendingRefunds.length,
      sub: autoRefundable.length > 0 ? `${autoRefundable.length} auto` : "None",
      bg: pendingRefunds.length > 0 ? "#fff3cd" : "#f4ded5",
      color: pendingRefunds.length > 0 ? "#856404" : "#8b7266",
    },
  ];

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            color: "#241914",
          }}
        >
          Xin chào, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#584238",
            marginTop: 4,
          }}
        >
          Đây là tổng quan hoạt động các sân của bạn hôm nay
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: s.bg, border: `1px solid ${s.color}22` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: s.color + "22", color: s.color }}
              >
                {s.icon}
              </div>
            </div>
            <p
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: s.wide ? "18px" : "26px",
                fontWeight: 800,
                color: "#241914",
                lineHeight: 1.1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#584238",
                marginTop: 4,
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: s.color,
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── My Venues ─────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "#241914",
              }}
            >
              Sân của tôi
            </h2>
            <button
              onClick={() => navigate("/owner/venues")}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#a04100",
                fontWeight: 600,
              }}
            >
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>

          {venues.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "#fff", border: "1.5px dashed #dfc0b3" }}
            >
              <Building2 size={36} style={{ color: "#dfc0b3", margin: "0 auto 12px" }} />
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#8b7266" }}>
                Chưa có sân nào. Hãy thêm sân đầu tiên!
              </p>
            </div>
          ) : (
            venues.map((venue) => {
              const vBookings = myBookings.filter((b) => b.venueId === venue.id);
              const vRevenue = vBookings
                .filter((b) => b.status === "confirmed")
                .reduce((s, b) => s + b.totalPrice, 0);
              return (
                <div
                  key={venue.id}
                  className="rounded-2xl overflow-hidden flex gap-0 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ background: "#fff", border: "1px solid #dfc0b3" }}
                  onClick={() => navigate(`/owner/venues/${venue.id}`)}
                >
                  <div className="relative shrink-0 overflow-hidden" style={{ width: 130 }}>
                    <ImageWithFallback
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                      style={{ height: "100%", minHeight: 110 }}
                    />
                    <div className="absolute bottom-2 left-2">
                      <span
                        className="px-2 py-0.5 rounded-md capitalize"
                        style={{
                          background: "rgba(36,25,20,0.6)",
                          backdropFilter: "blur(4px)",
                          color: "#fff",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                        }}
                      >
                        {SPORT_EMOJI[venue.sports[0]]} {venue.sports[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h3
                        style={{
                          fontFamily: "Lexend, sans-serif",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#241914",
                        }}
                      >
                        {venue.name}
                      </h3>
                      <span className="flex items-center gap-1">
                        <Star size={12} fill="#a04100" color="#a04100" />
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "12px",
                            color: "#241914",
                            fontWeight: 600,
                          }}
                        >
                          {venue.rating}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span
                        className="flex items-center gap-1"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#584238",
                        }}
                      >
                        <CalendarDays size={12} style={{ color: "#a04100" }} />
                        {vBookings.length} bookings
                      </span>
                      <span
                        className="flex items-center gap-1"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#584238",
                        }}
                      >
                        <Users size={12} style={{ color: "#a04100" }} />
                        {venue.courtCount} courts
                      </span>
                      <span
                        className="flex items-center gap-1"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#584238",
                        }}
                      >
                        <Clock size={12} style={{ color: "#a04100" }} />
                        {venue.openHours}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#f4ded5]">
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#8b7266",
                        }}
                      >
                        Revenue
                      </span>
                      <span
                        style={{
                          fontFamily: "Lexend, sans-serif",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#a04100",
                        }}
                      >
                        {formatPrice(vRevenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center pr-4" style={{ color: "#dfc0b3" }}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── Recent Bookings ────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <h2
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#241914",
            }}
          >
            Booking gần đây
          </h2>
          {myBookings.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "#fff", border: "1.5px dashed #dfc0b3" }}
            >
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#8b7266" }}>
                Chưa có booking nào
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden flex flex-col divide-y divide-[#f4ded5]"
              style={{ background: "#fff", border: "1px solid #dfc0b3" }}
            >
              {myBookings.slice(0, 6).map((b) => {
                const STATUS_COLOR: Record<string, string> = {
                  confirmed: "#006a65",
                  processing_refund: "#856404",
                  refunded: "#8b7266",
                  cancelled: "#8b7266",
                };
                const STATUS_BG: Record<string, string> = {
                  confirmed: "#e7f8f7",
                  processing_refund: "#fff3cd",
                  refunded: "#f4ded5",
                  cancelled: "#f4ded5",
                };
                return (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                      style={{ background: "#fff1eb" }}
                    >
                      {SPORT_EMOJI[b.sport]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#241914",
                        }}
                      >
                        {b.venueName}
                      </p>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          color: "#8b7266",
                        }}
                      >
                        {formatDate(b.date)} · {b.slots.length} slot{b.slots.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: STATUS_BG[b.status],
                          color: STATUS_COLOR[b.status],
                          fontFamily: "Inter, sans-serif",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {b.status === "processing_refund" ? "Refunding" : b.status}
                      </span>
                      <span
                        style={{
                          fontFamily: "Lexend, sans-serif",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#a04100",
                        }}
                      >
                        {formatPrice(b.totalPrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
