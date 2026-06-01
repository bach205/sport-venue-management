// @ts-nocheck
import React, { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { icon } from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { X, MapPin, Clock, Star, ShieldCheck, MessageSquare, Info, LocateFixed, LoaderCircle, Search } from "lucide-react";
import { cancelMatchRequest, submitMatchRating, submitMatchRequest } from "../api/matchingApi";
import type { MatchRequest, MatchResult } from "../types/matching.types";
import type { Sport, SkillLevel, PostType } from "../../discover/types/discover.types";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { resolveAvatar } from "../../../shared/assets/avatarMap";
import {
  SKILL_LEVEL_OPTIONS,
  SPORT_ICON_BY_VALUE,
  SPORT_LABEL_BY_VALUE,
  SPORT_OPTIONS,
} from "@/shared/constants/matchOptions";
import {
  createOrOpenConversation,
  MOCK_USERS,
} from "../../messages/store/messagesStore";
import { isMockApi } from "@/shared/constants/api";
import { joinUserRoom, socket } from "@/shared/socket/socketClient";
import { useAppSelector } from "@/shared/hooks/useAppSelector";

import imgMatchGraphic from "../../../imports/Html→Body-2/c1c6d62b4135dfdd55aafefa06abfdf8321f96cf.png";
import imgOpponent from "../../../imports/Html→Body-2/781a656a29f4ab3f37bb8c8ba8f0a14ecb4a100e.png";

const SPORTS = SPORT_OPTIONS;
const SPORT_ICONS = SPORT_ICON_BY_VALUE;
const SPORT_LABELS = SPORT_LABEL_BY_VALUE;
const DEFAULT_MAP_CENTER = { lat: 10.7769, lng: 106.7009 };
const NOMINATIM_DEBOUNCE_MS = 1100;
const reverseGeocodeCache = new Map<string, string>();
const addressSearchCache = new Map<string, any[]>();
const LOCATION_MARKER_ICON = icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

function MapPositionSync({
  position,
}: {
  position: { lat: number; lng: number };
}) {
  const map = useMap();

  useEffect(() => {
    map.panTo(position);
  }, [position.lat, position.lng]);

  return null;
}

function LocationSelectionEvents({
  onSelect,
}: {
  onSelect: (next: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (event) => onSelect(event.latlng),
  });

  return null;
}

function OpenStreetMapLocationPicker({
  position,
  radiusKm,
  onChange,
  onRadiusChange,
}: {
  position: { lat: number; lng: number };
  radiusKm: number;
  onChange: (next: { lat: number; lng: number; address: string }) => void;
  onRadiusChange: (next: number) => void;
}) {
  const { t } = useTranslation("matching");
  const reverseGeocodeAbortRef = useRef<AbortController | null>(null);
  const reverseGeocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressSearchAbortRef = useRef<AbortController | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const updateLocation = useCallback(
    (next: { lat: number; lng: number }) => {
      const fallbackAddress = `${next.lat.toFixed(6)}, ${next.lng.toFixed(6)}`;
      onChange({ ...next, address: fallbackAddress });

      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
      }
      reverseGeocodeAbortRef.current?.abort();
      const cacheKey = `${next.lat.toFixed(5)},${next.lng.toFixed(5)}`;
      const cachedAddress = reverseGeocodeCache.get(cacheKey);

      if (cachedAddress) {
        onChange({ ...next, address: cachedAddress });
        return;
      }

      reverseGeocodeTimerRef.current = setTimeout(async () => {
        const abortController = new AbortController();
        reverseGeocodeAbortRef.current = abortController;

        try {
          const searchParams = new URLSearchParams({
            format: "jsonv2",
            lat: String(next.lat),
            lon: String(next.lng),
            zoom: "18",
            addressdetails: "1",
          });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${searchParams}`,
            {
              headers: { "Accept-Language": t("map.geocodingLanguage") },
              signal: abortController.signal,
            }
          );
          if (!response.ok) return;

          const result = await response.json();
          if (result.display_name) {
            reverseGeocodeCache.set(cacheKey, result.display_name);
            onChange({ ...next, address: result.display_name });
          }
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.warn("[OpenStreetMap] reverse geocoding failed", error);
          }
        }
      }, NOMINATIM_DEBOUNCE_MS);
    },
    [onChange, t]
  );

  const handleAddressSearch = async () => {
    const query = addressQuery.trim();
    setAddressSearchError("");

    if (query.length < 3) {
      setAddressSearchResults([]);
      setAddressSearchError(t("map.addressQueryTooShort"));
      return;
    }

    const cacheKey = `${t("map.geocodingLanguage")}:${query.toLowerCase()}`;
    const cachedResults = addressSearchCache.get(cacheKey);
    if (cachedResults) {
      setAddressSearchResults(cachedResults);
      setAddressSearchError(cachedResults.length ? "" : t("map.noAddressResults"));
      return;
    }

    addressSearchAbortRef.current?.abort();
    const abortController = new AbortController();
    addressSearchAbortRef.current = abortController;
    setIsSearchingAddress(true);

    try {
      const searchParams = new URLSearchParams({
        format: "jsonv2",
        q: query,
        addressdetails: "1",
        limit: "5",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams}`,
        {
          headers: { "Accept-Language": t("map.geocodingLanguage") },
          signal: abortController.signal,
        }
      );
      if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

      const results = await response.json();
      addressSearchCache.set(cacheKey, results);
      setAddressSearchResults(results);
      setAddressSearchError(results.length ? "" : t("map.noAddressResults"));
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.warn("[OpenStreetMap] address search failed", error);
        setAddressSearchError(t("map.addressSearchError"));
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearchingAddress(false);
      }
    }
  };

  const handleSelectAddress = (result: any) => {
    const next = {
      lat: Number(result.lat),
      lng: Number(result.lon),
    };
    const cacheKey = `${next.lat.toFixed(5)},${next.lng.toFixed(5)}`;

    reverseGeocodeCache.set(cacheKey, result.display_name);
    setAddressQuery(result.display_name);
    setAddressSearchResults([]);
    setAddressSearchError("");
    onChange({ ...next, address: result.display_name });
  };

  const handleUseCurrentLocation = useCallback(() => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(t("map.geolocationUnsupported"));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        updateLocation({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        setIsLocating(false);
        setLocationError(t("map.geolocationError"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [t, updateLocation]);

  useEffect(() => {
    handleUseCurrentLocation();

    return () => {
      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
      }
      reverseGeocodeAbortRef.current?.abort();
      addressSearchAbortRef.current?.abort();
    };
  }, [handleUseCurrentLocation]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="search"
            value={addressQuery}
            onChange={(event) => setAddressQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddressSearch();
              }
            }}
            placeholder={t("map.addressPlaceholder")}
            aria-label={t("map.addressPlaceholder")}
            className="h-10 min-w-0 flex-1 rounded-lg border border-[#dfc0b3] bg-white px-3 text-sm outline-none focus:border-[#006a65]"
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isSearchingAddress}
            title={t("map.searchAddress")}
            aria-label={t("map.searchAddress")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#006a65] text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {isSearchingAddress ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </button>
        </div>
        {addressSearchResults.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-lg border border-[#dfc0b3] bg-white shadow-md">
            {addressSearchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelectAddress(result)}
                className="flex w-full items-start gap-2 border-b border-[#f4ded5] px-3 py-2 text-left text-xs text-[#584238] transition-colors last:border-b-0 hover:bg-[#fff1eb]"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#006a65]" />
                <span>{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
        {addressSearchError && (
          <p className="mt-1 text-xs text-[#ba1a1a]">{addressSearchError}</p>
        )}
      </div>
      <div
        className="relative h-52 w-full overflow-hidden rounded-xl border border-[#dfc0b3]"
        style={{ background: "#f4ded5" }}
      >
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable
            icon={LOCATION_MARKER_ICON}
            position={position}
            eventHandlers={{
              dragend: (event) => updateLocation(event.target.getLatLng()),
            }}
          />
          <Circle
            center={position}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#006a65",
              fillColor: "#006a65",
              fillOpacity: 0.12,
              opacity: 0.7,
              weight: 2,
            }}
          />
          <MapPositionSync position={position} />
          <LocationSelectionEvents onSelect={updateLocation} />
        </MapContainer>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title={t("map.useCurrentLocation")}
          aria-label={t("map.useCurrentLocation")}
          className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfc0b3] bg-white text-[#006a65] shadow-md transition-colors hover:bg-[#e6f9f5] disabled:cursor-wait disabled:opacity-70"
        >
          {isLocating ? (
            <LoaderCircle size={19} className="animate-spin" />
          ) : (
            <LocateFixed size={19} />
          )}
        </button>
      </div>
      {locationError && (
        <p className="text-xs text-[#ba1a1a]">{locationError}</p>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#241914" }}>
            {t("map.radius")}
          </label>
          <output
            className="rounded-md bg-[#e6f9f5] px-2 py-1 text-sm font-semibold text-[#006a65]"
            aria-live="polite"
          >
            {t("map.radiusValue", { count: radiusKm })}
          </output>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={radiusKm}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          className="w-full accent-[#006a65]"
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 1: Request Form
// ──────────────────────────────────────────────
function RequestForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (r: MatchRequest) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("matching");
  const [sport, setSport] = useState<Sport>("tennis");
  const [location, setLocation] = useState("");
  const [mapPosition, setMapPosition] = useState(DEFAULT_MAP_CENTER);
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);
  const [time, setTime] = useState("18:00");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("intermediate");
  const [type, setType] = useState<PostType>("opponent");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const handleLocationChange = useCallback(
    (next: { lat: number; lng: number; address: string }) => {
      setMapPosition({ lat: next.lat, lng: next.lng });
      setLocation(next.address);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError(t("form.locationRequired"));
      return;
    }
    setError("");
    onSubmit({
      sport,
      location,
      locationLat: mapPosition.lat,
      locationLng: mapPosition.lng,
      searchRadiusKm,
      date: today,
      time,
      skillLevel,
      type,
    });
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    color: "#241914",
    border: "1.5px solid #dfc0b3",
    borderRadius: "10px",
    padding: "10px 14px",
    width: "100%",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-[#dfc0b3]">
        <div>
          <h2
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "#241914",
            }}
          >
            {t("form.title")}
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#8b7266",
              marginTop: 2,
            }}
          >
            {t("form.subtitle")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors"
          style={{ color: "#584238" }}
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5"
      >
        {/* Sport */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 8,
            }}
          >
            {t("form.sport")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSport(s.value)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: sport === s.value ? "#a04100" : "#dfc0b3",
                  background: sport === s.value ? "#fff1eb" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: sport === s.value ? 600 : 400,
                  color: sport === s.value ? "#a04100" : "#584238",
                }}
              >
                <span>{s.emoji}</span> {t(`sports.${s.value}`, s.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
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
            <MapPin size={13} style={{ display: "inline", marginRight: 4 }} />
            {t("form.location")}
          </label>
          <input value={location} readOnly style={{ ...inputStyle, marginBottom: 10 }} />
          <OpenStreetMapLocationPicker
            position={mapPosition}
            radiusKm={searchRadiusKm}
            onChange={handleLocationChange}
            onRadiusChange={setSearchRadiusKm}
          />
        </div>

        {/* Time */}
        <div>
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
            <Clock size={13} style={{ display: "inline", marginRight: 4 }} />
            {t("form.time")}
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#006a65";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#dfc0b3";
            }}
          />
        </div>

        {/* Skill Level */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 8,
            }}
          >
            {t("form.skill")}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {SKILL_LEVEL_OPTIONS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSkillLevel(level.value)}
                className="w-full rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: skillLevel === level.value ? "#a04100" : "#dfc0b3",
                  background: skillLevel === level.value ? "#fff1eb" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: skillLevel === level.value ? 600 : 400,
                  color: skillLevel === level.value ? "#a04100" : "#584238",
                  padding: "10px 12px",
                }}
              >
                <span style={{ display: "block", fontWeight: 700 }}>
                  {t(`skillLevels.${level.value}.label`, level.label)}
                </span>
                <span style={{ display: "block", fontSize: 12, marginTop: 2, color: "#8b7266" }}>
                  {t(`skillLevels.${level.value}.description`, level.description)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#241914",
              display: "block",
              marginBottom: 8,
            }}
          >
            {t("form.lookingFor")}
          </label>
          <div className="flex gap-2">
            {(["opponent", "teammate"] as PostType[]).map((matchType) => (
              <button
                key={matchType}
                type="button"
                onClick={() => setType(matchType)}
                className="flex-1 py-2 rounded-xl border-2 transition-all capitalize"
                style={{
                  borderColor: type === matchType ? "#a04100" : "#dfc0b3",
                  background: type === matchType ? "#fff1eb" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: type === matchType ? 600 : 400,
                  color: type === matchType ? "#a04100" : "#584238",
                }}
              >
                {t(`matchTypes.${matchType}`)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#ba1a1a" }}>
            {error}
          </p>
        )}
      </form>

      {/* Footer CTA */}
      <div className="shrink-0 px-6 pb-6 pt-3 border-t border-[#dfc0b3]">
        <button
          onClick={handleSubmit as any}
          className="w-full h-14 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(90deg, #a04100 0%, #ff7e36 100%)",
            fontFamily: "Lexend, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
            boxShadow: "0 4px 16px rgba(160,65,0,0.35)",
          }}
        >
          ⚡ {t("form.submit")}
        </button>
        <p
          className="text-center mt-3"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8b7266" }}
        >
          {t("form.hint")}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 2: Searching Animation
// ──────────────────────────────────────────────
function SearchingScreen({ request, onCancel }: { request: MatchRequest; onCancel: () => void }) {
  const { t } = useTranslation("matching");
  const [dotCount, setDotCount] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [statusIndex, setStatusIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const statusMessages = [
    t("searching.statusCourts"),
    t("searching.statusSkills"),
    t("searching.statusTimes"),
    t("searching.statusRadius"),
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setDotCount((d) => (d + 1) % 4);
      setPulseScale((s) => (s === 1 ? 1.08 : 1));
    }, 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i + 1) % statusMessages.length);
    }, 2200);

    const elapsedTimer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  const sportEmoji = SPORT_ICONS[request.sport];
  const dots = ".".repeat(dotCount);
  const statusLine =
    elapsedSeconds >= 12
      ? t("searching.waiting")
      : statusMessages[statusIndex];
  const sportLabel = t(`sports.${request.sport}`, request.sport);
  const skillLabel = t(`skillLevels.${request.skillLevel}.label`, request.skillLevel);
  const locationLabel = t(`locations.${request.location}`, request.location);

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-6">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-2 py-2">
        {/* Animated radar */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 140, height: 140, flexShrink: 0 }}
        >
          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 35 + i * 35,
                height: 35 + i * 35,
                border: `2px solid rgba(160,65,0,${0.25 - i * 0.07})`,
                animation: `ping ${1.2 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
          {/* Center circle */}
          <div
            className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #a04100, #ff7e36)",
              boxShadow: "0 8px 24px rgba(160,65,0,0.4)",
              transform: `scale(${pulseScale})`,
              transition: "transform 0.6s ease",
            }}
          >
            <span style={{ fontSize: 32 }}>{sportEmoji}</span>
          </div>
        </div>

        <div className="text-center">
          <h2
            style={{
              fontFamily: "Lexend, sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#241914",
            }}
          >
            {t("searching.title", { dots })}
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#584238",
              marginTop: 8,
            }}
          >
            {t("searching.subtitle", {
              skill: skillLabel,
              sport: sportLabel,
              location: locationLabel,
            })}
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#8b7266",
              marginTop: 6,
            }}
          >
            {statusLine}
          </p>
        </div>

        {/* Search criteria pills */}
        <div className="flex w-full flex-wrap justify-center gap-2">
          {[
            { label: `${sportEmoji} ${sportLabel}` },
            { label: `📍 ${locationLabel}`, truncate: true },
            { label: `◎ ${t("map.radiusValue", { count: request.searchRadiusKm || 5 })}` },
            { label: `🎯 ${skillLabel}` },
            { label: `⏰ ${request.time}` },
          ].map((tag) => (
            <span
              key={tag.label}
              title={tag.truncate ? tag.label : undefined}
              className={`rounded-full px-3 py-1.5 ${tag.truncate ? "max-w-full truncate" : ""}`}
              style={{
                background: "#fff1eb",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                color: "#a04100",
                border: "1px solid #dfc0b3",
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-2 pb-2 pt-5">
        <button
          onClick={onCancel}
          className="h-11 w-full rounded-xl transition-opacity hover:opacity-90"
          style={{
            background: "#a04100",
            boxShadow: "0 3px 10px rgba(160,65,0,0.22)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          {t("searching.cancel")}
        </button>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 3: Match Found
// ──────────────────────────────────────────────
function MatchFoundScreen({
  result,
  onGoToChat,
  onViewDetails,
  onClose,
}: {
  result: MatchResult;
  onGoToChat: () => void;
  onViewDetails: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("matching");
  const avatarSrc = resolveAvatar(result.opponent.avatar);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

  const handleSubmitRating = async () => {
    if (!result.matchId || !selectedRating || ratingSubmitting) return;
    setRatingSubmitting(true);
    const res = await submitMatchRating(result.matchId, selectedRating);
    setRatingSubmitting(false);
    setRatingMessage(res.success ? t("matched.ratingSuccess") : res.message);
  };

  return (
    <div
      className="flex flex-col items-center overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #fff8f6 0%, #fff 60%)" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#fff1eb] transition-colors z-10"
        style={{ color: "#584238" }}
      >
        <X size={20} />
      </button>

      {/* Hero graphic area */}
      <div className="relative flex flex-col items-center pt-12 pb-4 w-full">
        {/* Circle with court image */}
        <div
          className="relative w-[180px] h-[180px] rounded-full overflow-hidden flex items-center justify-center mb-6"
          style={{
            background: "#ff7e36",
            boxShadow: "0 10px 30px rgba(160,65,0,0.3)",
            border: "4px solid #fff8f6",
          }}
        >
          <img
            src={imgMatchGraphic}
            alt={t("matched.imageAlt")}
            style={{
              position: "absolute",
              width: "155%",
              left: "-27%",
              top: 0,
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Decoration blobs */}
          <div
            className="absolute top-[-6px] right-[-6px] w-8 h-8 rounded-full opacity-80"
            style={{ background: "#6ef4ea", mixBlendMode: "multiply" }}
          />
          <div
            className="absolute bottom-[-4px] left-[-8px] w-10 h-10 rounded-full opacity-60"
            style={{ background: "#f4ded5" }}
          />
        </div>

        <h1
          className="text-center"
          style={{
            fontFamily: "Lexend, sans-serif",
            fontSize: "40px",
            fontWeight: 800,
            color: "#a04100",
            letterSpacing: "-0.8px",
            lineHeight: 1.1,
          }}
        >
          {t("matched.title")}
        </h1>
        <p
          className="text-center mt-2"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "16px", color: "#584238" }}
        >
          {t("matched.subtitleLine1")}
          <br />
          {t("matched.subtitleLine2")}
        </p>
      </div>

      {/* Match details card */}
      <div
        className="mx-6 mb-4 rounded-xl w-[calc(100%-48px)]"
        style={{
          background: "#fff",
          border: "1px solid rgba(223,192,179,0.3)",
          boxShadow: "0 4px 16px rgba(36,25,20,0.1)",
        }}
      >
        <div className="p-6 flex flex-col gap-4">
          {/* Sport + Time + Confirmed badge */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f4ded5]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#6ef4ea" }}
              >
                <span style={{ fontSize: 22 }}>{SPORT_ICONS[result.sport]}</span>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "Lexend, sans-serif",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#241914",
                  }}
                >
                  {t(`sports.${result.sport}`, SPORT_LABELS[result.sport])}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={12} style={{ color: "#006a65" }} />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#006a65",
                    }}
                  >
                    {result.time}
                  </span>
                </div>
              </div>
            </div>
            <span
              className="px-3 py-1 rounded-full text-white uppercase tracking-wider"
              style={{
                background: "#a04100",
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              {t("matched.confirmed")}
            </span>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-3">
            <MapPin size={16} style={{ color: "#8b7266", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#241914",
                }}
              >
                {result.venue}
              </p>
              {result.venueDetail && result.venueDetail !== result.venue && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#584238" }}>
                  {result.venueDetail}
                </p>
              )}
            </div>
          </div>

          {/* Opponent card */}
          <div
            className="rounded-lg p-4"
            style={{ background: "#fff1eb", border: "1px solid rgba(223,192,179,0.2)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Opponent avatar */}
                <div
                  className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    background: "#9ba3b3",
                    border: "2px solid #fff8f6",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {avatarSrc ? (
                    <ImageWithFallback
                      src={avatarSrc}
                      alt={result.opponent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={imgOpponent}
                      alt={result.opponent.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "Lexend, sans-serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#241914",
                    }}
                  >
                    {result.opponent.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} fill="#a04100" color="#a04100" />
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#241914",
                      }}
                    >
                      {result.opponent.rating}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        color: "#584238",
                      }}
                    >
                      ({t("matched.matches", { count: result.opponent.matchCount })})
                    </span>
                  </div>
                </div>
              </div>
              <span
                className="px-2 py-1 rounded-full"
                style={{
                  background: "#dbe3f4",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#141c28",
                }}
              >
                {TIER_LABELS[result.opponent.tier] || result.opponent.tier}
              </span>
            </div>
          </div>

          {/* Post-match rating */}
          <div
            className="rounded-lg p-4"
            style={{ background: "#fff", border: "1px solid #f4ded5" }}
          >
            <p
              style={{
                fontFamily: "Lexend, sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "#241914",
              }}
            >
              {t("matched.rateTitle")}
            </p>
            <div className="flex items-center gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRating(value)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: value <= selectedRating ? "#fff1eb" : "#fff8f6",
                    border: "1px solid #dfc0b3",
                  }}
                  disabled={Boolean(ratingMessage)}
                  title={t("matched.starTitle", { count: value })}
                >
                  <Star
                    size={18}
                    fill={value <= selectedRating ? "#f5a623" : "transparent"}
                    color={value <= selectedRating ? "#f5a623" : "#8b7266"}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={!selectedRating || ratingSubmitting || Boolean(ratingMessage)}
                className="h-9 px-4 rounded-lg transition-opacity"
                style={{
                  background:
                    selectedRating && !ratingMessage ? "linear-gradient(90deg, #006a65, #4db6ac)" : "#dfc0b3",
                  color: "#fff",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  opacity: ratingSubmitting ? 0.7 : 1,
                }}
              >
                {ratingSubmitting ? t("matched.savingRating") : t("matched.submitRating")}
              </button>
            </div>
            {ratingMessage && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#006a65", marginTop: 8 }}>
                {ratingMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 px-6 w-full mb-4">
        <button
          onClick={onGoToChat}
          className="w-full h-14 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(90deg, #a04100, #ff7e36)",
            fontFamily: "Lexend, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            border: "none",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            boxShadow: "0 4px 14px rgba(160,65,0,0.4)",
          }}
        >
          <MessageSquare size={20} />
          {t("matched.goToChat")}
        </button>
        <button
          onClick={onViewDetails}
          className="w-full h-13 rounded-xl flex items-center justify-center gap-2 hover:bg-[#e6f9f5] transition-colors"
          style={{
            border: "2px solid #006a65",
            background: "transparent",
            fontFamily: "Lexend, sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "#006a65",
            padding: "14px 24px",
          }}
        >
          <Info size={18} />
          {t("matched.viewDetails")}
        </button>
      </div>

      {/* Safe match */}
      <div className="flex items-center gap-2 pb-6">
        <ShieldCheck size={14} style={{ color: "#584238" }} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#584238" }}>
          {t("matched.safeVerified")}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Modal Component
// ──────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export function MatchingModal({ onClose }: Props) {
  const { t } = useTranslation("matching");
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const currentUserId = authUser?._id ?? null;
  const [step, setStep] = useState<"form" | "searching" | "matched">("form");
  const [request, setRequest] = useState<MatchRequest | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  const pendingMatchHandlerRef = useRef<((payload: any) => void) | null>(null);
  const pendingMatchRejectRef = useRef<((error: Error) => void) | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const searchTokenRef = useRef(0);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const joinUser = () => joinUserRoom(currentUserId);

    if (socket.connected) {
      joinUser();
    }
    socket.on("connect", joinUser);

    return () => {
      socket.off("connect", joinUser);
    };
  }, [currentUserId]);

  const clearPendingMatchListener = (reason?: string) => {
    if (pendingMatchHandlerRef.current) {
      socket.off("matching:request:matched", pendingMatchHandlerRef.current);
      pendingMatchHandlerRef.current = null;
    }

    if (pendingMatchRejectRef.current && reason) {
      pendingMatchRejectRef.current(new Error(reason));
    }

    pendingMatchRejectRef.current = null;
  };

  const isRelevantMatch = (incoming: any) => {
    const activeRequestId = activeRequestIdRef.current;
    if (!activeRequestId) {
      return true;
    }

    if (incoming?.request?.id === activeRequestId) {
      return true;
    }

    const requestIds = incoming?.match?.requestIds;
    if (!Array.isArray(requestIds)) {
      return false;
    }

    return requestIds.some((id) => String(id) === String(activeRequestId));
  };

  const formatMatchTime = (timeValue: string | undefined, requestForTime: MatchRequest) => {
    let date: Date | null = null;

    if (timeValue) {
      const parsed = new Date(timeValue);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    } else if (requestForTime?.date && requestForTime?.time) {
      const parsed = new Date(`${requestForTime.date}T${requestForTime.time}:00`);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (!date) {
      return requestForTime?.time
        ? t("time.today", { time: requestForTime.time })
        : t("time.scheduled");
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return isToday ? t("time.today", { time: `${hh}:${mm}` }) : `${date.toLocaleDateString()} ${hh}:${mm}`;
  };

  const buildMatchResultFromPayload = (payload: any, requestForTime: MatchRequest): MatchResult => {
    const match = payload?.match ?? {};
    const partner = match?.partner ?? payload?.partner ?? {};
    const requestId =
      payload?.request?.id ??
      match?.requestIds?.[0] ??
      activeRequestIdRef.current ??
      `req-${Date.now()}`;
    const location = match?.location ?? requestForTime.location;

    return {
      matchId: match?.id,
      requestId,
      sport: match?.sport ?? requestForTime.sport,
      skillLevel: requestForTime.skillLevel,
      venue: location,
      venueDetail: location,
      time: formatMatchTime(match?.time, requestForTime),
      opponent: {
        id: partner?.id ?? "unknown",
        name: partner?.name ?? t("fallback.opponent"),
        avatar: partner?.avatar ?? "",
        rating: partner?.rating ?? 0,
        matchCount: partner?.matchCount ?? 0,
        tier: partner?.tier ?? "Rookie",
      },
      conversationId: payload?.conversation?.id ?? match?.conversationId ?? "",
    };
  };

  const finalizeMatch = (matchResult: MatchResult) => {
    setResult(matchResult);
    setStep("matched");

    if (!isMockApi) return;

    const knownUser = MOCK_USERS[matchResult.opponent.id];
    const user = knownUser ?? {
      id: matchResult.opponent.id,
      name: matchResult.opponent.name,
      avatar: matchResult.opponent.avatar,
      isOnline: true,
    };

    createOrOpenConversation(
      user,
      `${t("matched.title")} ${user.name} · ${t(`sports.${matchResult.sport}`, SPORT_LABELS[matchResult.sport])} · ${matchResult.time} · ${matchResult.venue}`
    );
  };

  const handleSubmit = async (req: MatchRequest) => {
    const CANCELLED_ERROR = "match-search-cancelled";
    const searchToken = searchTokenRef.current + 1;
    searchTokenRef.current = searchToken;

    if (currentUserId) {
      joinUserRoom(currentUserId);
    }

    clearPendingMatchListener();
    activeRequestIdRef.current = null;
    setRequest(req);
    setResult(null);
    setStep("searching");

    try {
      const response = await submitMatchRequest(req);
      if (searchToken !== searchTokenRef.current) return;
      const payload = response?.data ?? response;
      const requestId = payload?.request?.id ?? null;
      activeRequestIdRef.current = requestId;

      if (payload?.match) {
        if (searchToken !== searchTokenRef.current) return;
        finalizeMatch(buildMatchResultFromPayload(payload, req));
        activeRequestIdRef.current = null;
        return;
      }

      const matchedPayload = await new Promise((resolve, reject) => {
        const handleMatched = (incoming: any) => {
          if (!incoming?.request?.id && !Array.isArray(incoming?.match?.requestIds)) return;
          if (!isRelevantMatch(incoming)) return;
          clearPendingMatchListener();
          resolve(incoming);
        };

        pendingMatchHandlerRef.current = handleMatched;
        pendingMatchRejectRef.current = reject;
        socket.on("matching:request:matched", handleMatched);
      });

      if (searchToken !== searchTokenRef.current) return;
      finalizeMatch(buildMatchResultFromPayload(matchedPayload, req));
      activeRequestIdRef.current = null;
    } catch (error: any) {
      if (error?.message === CANCELLED_ERROR) {
        return;
      }

      console.error(error);
      setStep("form");
      setRequest(null);
      setResult(null);
    }
  };

  const handleGoToChat = () => {
    if (!result) return;
    onClose();
    const knownUser = MOCK_USERS[result.opponent.id];
    const userId = result.opponent.id;
    const name = result.opponent.name;
    const avatar = result.opponent.avatar;
    navigate(
      `/messages?with=${userId}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar)}&sport=${result.sport}`
    );
  };

  const handleCancel = () => {
    const requestId = activeRequestIdRef.current;
    searchTokenRef.current += 1;
    clearPendingMatchListener("match-search-cancelled");
    activeRequestIdRef.current = null;
    setStep("form");
    setRequest(null);
    setResult(null);

    if (requestId) {
      cancelMatchRequest(requestId).catch((error) => {
        console.warn("Failed to cancel pending match request.", error);
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(36,25,20,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "searching") onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl w-full overflow-hidden"
        style={{
          maxWidth: 520,
          height: step === "form" ? "min(92vh, 805px)" : undefined,
          maxHeight: "92vh",
          boxShadow: "0 24px 64px rgba(36,25,20,0.3)",
        }}
      >
        {step === "form" && <RequestForm onSubmit={handleSubmit} onClose={onClose} />}

        {step === "searching" && request && (
          <div style={{ height: "min(92vh, 620px)" }}>
            <SearchingScreen request={request} onCancel={handleCancel} />
          </div>
        )}

        {step === "matched" && result && (
          <div className="overflow-y-auto" style={{ maxHeight: "92vh" }}>
            <MatchFoundScreen
              result={result}
              onGoToChat={handleGoToChat}
              onViewDetails={() => {
                /* show details */
              }}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
