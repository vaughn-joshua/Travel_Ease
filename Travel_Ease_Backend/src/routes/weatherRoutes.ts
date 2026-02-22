/**
 * Weather API Routes - /api/weather
 * Proxies Tomorrow.io weather API to keep the API key server-side.
 * Supports realtime (no date / today) and forecast (future date) lookups.
 */

import { Router, Request, Response } from 'express';

const router = Router();

// ─── Tomorrow.io weather code → emoji + label map ────────────────────────────
const WEATHER_CODES: Record<number, { icon: string; label: string }> = {
  1000: { icon: '☀️', label: 'Clear' },
  1001: { icon: '☁️', label: 'Cloudy' },
  1100: { icon: '🌤️', label: 'Mostly Clear' },
  1101: { icon: '⛅', label: 'Partly Cloudy' },
  1102: { icon: '🌥️', label: 'Mostly Cloudy' },
  2000: { icon: '🌫️', label: 'Fog' },
  2100: { icon: '🌁', label: 'Light Fog' },
  3000: { icon: '💨', label: 'Light Wind' },
  3001: { icon: '🌬️', label: 'Wind' },
  3002: { icon: '🌪️', label: 'Strong Wind' },
  4000: { icon: '🌦️', label: 'Drizzle' },
  4001: { icon: '🌧️', label: 'Rain' },
  4200: { icon: '🌧️', label: 'Light Rain' },
  4201: { icon: '⛈️', label: 'Heavy Rain' },
  5000: { icon: '❄️', label: 'Snow' },
  5001: { icon: '🌨️', label: 'Flurries' },
  5100: { icon: '🌨️', label: 'Light Snow' },
  5101: { icon: '❄️', label: 'Heavy Snow' },
  6000: { icon: '🌧️', label: 'Freezing Drizzle' },
  6001: { icon: '🌧️', label: 'Freezing Rain' },
  6200: { icon: '❄️', label: 'Light Freezing Rain' },
  6201: { icon: '🌩️', label: 'Heavy Freezing Rain' },
  7000: { icon: '🌨️', label: 'Ice Pellets' },
  7101: { icon: '🌨️', label: 'Heavy Ice Pellets' },
  7102: { icon: '🌨️', label: 'Light Ice Pellets' },
  8000: { icon: '⛈️', label: 'Thunderstorm' },
};

// ─── Simple in-memory cache (5 min TTL) ──────────────────────────────────────
interface CacheEntry {
  data: WeatherResult;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(lat: number, lng: number, date?: string): string {
  // Round coords to 2 decimal places to improve cache hits for nearby queries
  return `${lat.toFixed(2)},${lng.toFixed(2)},${date ?? 'now'}`;
}

// ─── Normalized weather result shape ─────────────────────────────────────────
interface WeatherResult {
  temp: number;
  feelsLike: number;
  humidity: number;
  weatherCode: number;
  icon: string;
  description: string;
  windSpeed: number;
}

function normalizeValues(values: Record<string, number>): WeatherResult {
  const code = values.weatherCode ?? 1000;
  const meta = WEATHER_CODES[code] ?? { icon: '🌡️', label: 'Unknown' };
  return {
    temp: Math.round(values.temperature ?? values.temperatureAvg ?? 0),
    feelsLike: Math.round(values.temperatureApparent ?? values.temperatureApparentAvg ?? 0),
    humidity: Math.round(values.humidity ?? values.humidityAvg ?? 0),
    windSpeed: Math.round(values.windSpeed ?? values.windSpeedAvg ?? 0),
    weatherCode: code,
    icon: meta.icon,
    description: meta.label,
  };
}

/**
 * GET /api/weather
 * Query params:
 *   lat    – latitude  (required)
 *   lng    – longitude (required)
 *   date   – ISO date string YYYY-MM-DD (optional; omit for realtime)
 */
router.get('/', async (req: Request, res: Response) => {
  const latRaw = parseFloat(req.query.lat as string);
  const lngRaw = parseFloat(req.query.lng as string);
  const dateStr = (req.query.date as string | undefined)?.trim();

  if (isNaN(latRaw) || isNaN(lngRaw)) {
    return res.status(400).json({ error: 'lat and lng query parameters are required and must be numbers.' });
  }

  const apiKey = process.env.WEATHER_API;
  if (!apiKey) {
    return res.status(500).json({ error: 'Weather API key is not configured.' });
  }

  // ─── Decide if we need realtime or forecast ───────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = !dateStr || new Date(dateStr).toDateString() === today.toDateString();

  const cacheKey = getCacheKey(latRaw, lngRaw, dateStr);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.set('X-Cache', 'HIT');
    return res.json(cached.data);
  }

  try {
    let result: WeatherResult;

    if (isToday) {
      // ── Realtime endpoint ────────────────────────────────────────────────
      const url = `https://api.tomorrow.io/v4/weather/realtime?location=${latRaw},${lngRaw}&apikey=${apiKey}&units=metric`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[Weather] Realtime API error:', resp.status, errText);
        return res.status(502).json({ error: 'Failed to fetch weather data.' });
      }
      const body = await resp.json() as { data?: { values?: Record<string, number> } };
      const values = body?.data?.values;
      if (!values) {
        return res.status(502).json({ error: 'Unexpected weather API response format.' });
      }
      result = normalizeValues(values);
    } else {
      // ── Forecast endpoint – pick closest hourly interval ─────────────────
      const targetDate = new Date(dateStr!);
      const startTime = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const url = `https://api.tomorrow.io/v4/weather/forecast?location=${latRaw},${lngRaw}&apikey=${apiKey}&units=metric&timesteps=1d`;
      const resp = await fetch(url);
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[Weather] Forecast API error:', resp.status, errText);
        return res.status(502).json({ error: 'Failed to fetch weather forecast data.' });
      }
      const body = await resp.json() as {
        timelines?: {
          daily?: Array<{ time: string; values: Record<string, number> }>;
        };
      };
      const dailyTimelines = body?.timelines?.daily;
      if (!dailyTimelines?.length) {
        return res.status(502).json({ error: 'Unexpected weather forecast API response format.' });
      }

      // Find the entry matching our target date (or closest)
      const match = dailyTimelines.find(t => t.time.startsWith(startTime)) ?? dailyTimelines[0];
      result = normalizeValues(match.values);
    }

    // Store in cache
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    res.set('X-Cache', 'MISS');
    return res.json(result);
  } catch (err) {
    console.error('[Weather] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error while fetching weather.' });
  }
});

export default router;
