import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  icon: string;
  description: string;
}

interface WeatherWidgetProps {
  /** Latitude of the destination / plan location */
  lat: number;
  /** Longitude of the destination / plan location */
  lng: number;
  /** ISO date string (YYYY-MM-DD). Omit for realtime / today. */
  date?: string;
  /** Compact single-line rendering for overlay cards */
  compact?: boolean;
  /** Optional CSS class override */
  className?: string;
}

// ─── Simple fetch helper (no auth needed for weather) ────────────────────────
async function fetchWeather(lat: number, lng: number, date?: string): Promise<WeatherData> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (date) params.set("date", date);
  const resp = await fetch(`${API_BASE_URL}/weather?${params.toString()}`);
  if (!resp.ok) throw new Error("Failed to fetch weather");
  return resp.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WeatherWidget
 *
 * Displays current or forecasted weather for a given location.
 * Silently hides itself on errors so it never breaks the parent UI.
 *
 * Usage:
 *   <WeatherWidget lat={14.11} lng={120.96} compact />
 *   <WeatherWidget lat={14.11} lng={120.96} date="2026-03-01" />
 */
export function WeatherWidget({ lat, lng, date, compact = false, className = "" }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWeather(null);

    fetchWeather(lat, lng, date)
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lat, lng, date]);

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) {
    return compact ? (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
        <div className="w-12 h-3.5 rounded bg-gray-200 animate-pulse" />
      </div>
    ) : (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-1">
          <div className="w-16 h-4 rounded bg-gray-200 animate-pulse" />
          <div className="w-20 h-3 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error / No data – silently hide ────────────────────────────────────────
  if (!weather) return null;

  // ── Compact (single-line for overlay cards) ─────────────────────────────────
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`} title={`${weather.description} · Feels like ${weather.feelsLike}°C`}>
        <span className="text-base leading-none">{weather.icon}</span>
        <span className="text-sm font-bold text-gray-900">{weather.temp}°C</span>
        <span className="text-xs text-gray-500 truncate">{weather.description}</span>
      </div>
    );
  }

  // ── Full card ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-xl flex-shrink-0 border border-sky-100">
        {weather.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900 leading-none">{weather.temp}°C</span>
          <span className="text-xs text-gray-500 ml-1">{weather.description}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span title="Feels like">Feels {weather.feelsLike}°C</span>
          <span>💧 {weather.humidity}%</span>
          <span>💨 {weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;
