/**
 * Map Query Hooks
 *
 * TanStack Query hooks for geocoding and place search.
 * Uses ORS (OpenRouteService) Geocode API as primary source when available,
 * falls back to Nominatim when ORS key is not configured.
 *
 * ORS Geocode: https://api.openrouteservice.org/geocode
 * Nominatim:   https://nominatim.openstreetmap.org
 */

import { useQuery } from "@tanstack/react-query";
import { mapKeys } from "../../lib/queryKeys";
import type {
  NominatimPlace,
  NormalizedPlace,
  ORSGeocodeResponse,
} from "../../types/map";
import { businessApi } from "../../services/api";

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY ?? "";

// Tagaytay area — matches the map's maxBounds so search covers the full visible area
const TAGAYTAY_CENTER = { lat: 14.1154, lng: 120.962 };
const TAGAYTAY_VIEWBOX = "120.8,14.25,121.1,14.0"; // west,north,east,south
const TAGAYTAY_RECT = {
  minLon: 120.8,
  minLat: 14.0,
  maxLon: 121.1,
  maxLat: 14.25,
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeNominatimPlace(place: NominatimPlace): NormalizedPlace {
  const parts = (place.display_name || "").split(",").map((p) => p.trim());
  return {
    id: `nom_${place.place_id}`,
    name: parts[0] || "",
    fullLabel: place.display_name || "",
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
    type: place.type || place.class,
    address: {
      barangay: parts[1],
      city: parts[2],
      province: parts[3],
    },
  };
}

function normalizeORSPlace(
  feature: ORSGeocodeResponse["features"][number]
): NormalizedPlace {
  const p = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  return {
    id: `ors_${p.id}`,
    name: p.name,
    fullLabel: p.label,
    lat,
    lng,
    type: p.layer,
    address: {
      barangay: p.neighbourhood,
      city: p.locality,
      province: p.region,
      country: p.country,
    },
  };
}

function normalizeBusinessPlace(business: {
  business_id: number;
  name: string;
  description: string | null;
  city: string | null;
  brgy: string | null;
  street: string | null;
  house_number: string | null;
  latitude: number | null;
  longitude: number | null;
}): NormalizedPlace {
  const addressParts: string[] = [];
  if (business.house_number) addressParts.push(business.house_number);
  if (business.street) addressParts.push(business.street);
  if (business.brgy) addressParts.push(business.brgy);
  if (business.city) addressParts.push(business.city);

  const fullLabel =
    addressParts.length > 0
      ? `${business.name}, ${addressParts.join(", ")}`
      : business.name;

  return {
    id: `business_${business.business_id}`,
    name: business.name,
    fullLabel,
    lat: business.latitude!,
    lng: business.longitude!,
    type: "business",
    address: {
      barangay: business.brgy || undefined,
      city: business.city || undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ORS Geocode / Autocomplete (primary)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchORSAutocomplete(
  query: string,
  limit: number = 8,
  signal?: AbortSignal
): Promise<NormalizedPlace[]> {
  const params = new URLSearchParams({
    api_key: ORS_API_KEY,
    text: query,
    "boundary.country": "PH",
    "focus.point.lat": String(TAGAYTAY_CENTER.lat),
    "focus.point.lng": String(TAGAYTAY_CENTER.lng),
    "boundary.rect.min_lon": String(TAGAYTAY_RECT.minLon),
    "boundary.rect.min_lat": String(TAGAYTAY_RECT.minLat),
    "boundary.rect.max_lon": String(TAGAYTAY_RECT.maxLon),
    "boundary.rect.max_lat": String(TAGAYTAY_RECT.maxLat),
    size: String(limit),
  });

  const res = await fetch(
    `https://api.openrouteservice.org/geocode/autocomplete?${params}`,
    { signal, headers: { Accept: "application/json" } }
  );

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited — wait a moment.");
    throw new Error("ORS autocomplete failed");
  }

  const data: ORSGeocodeResponse = await res.json();
  return data.features.map(normalizeORSPlace);
}

async function fetchORSGeocode(
  query: string,
  limit: number = 1,
  signal?: AbortSignal
): Promise<NormalizedPlace[]> {
  const params = new URLSearchParams({
    api_key: ORS_API_KEY,
    text: query,
    "boundary.country": "PH",
    "focus.point.lat": String(TAGAYTAY_CENTER.lat),
    "focus.point.lng": String(TAGAYTAY_CENTER.lng),
    size: String(limit),
  });

  const res = await fetch(
    `https://api.openrouteservice.org/geocode/search?${params}`,
    { signal, headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error("ORS geocode failed");
  const data: ORSGeocodeResponse = await res.json();
  return data.features.map(normalizeORSPlace);
}

// ─────────────────────────────────────────────────────────────────────────────
// Nominatim (fallback when ORS key is missing)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchNominatimSearch(
  query: string,
  limit?: number,
  signal?: AbortSignal
): Promise<NormalizedPlace[]> {
  const limitParam = limit ? `&limit=${limit}` : "";
  const url =
    `https://nominatim.openstreetmap.org/search?format=json` +
    `&q=${encodeURIComponent(query)}` +
    `&countrycodes=ph` +
    `&viewbox=${TAGAYTAY_VIEWBOX}` +
    limitParam;

  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 429)
      throw new Error("Too many requests. Please wait a moment.");
    throw new Error("Failed to fetch search results");
  }

  const data: NominatimPlace[] = await res.json();
  return data.map(normalizeNominatimPlace);
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified search: ORS when key is set, Nominatim otherwise
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPlaceSearch(
  query: string,
  limit?: number,
  signal?: AbortSignal
): Promise<NormalizedPlace[]> {
  if (ORS_API_KEY) {
    return fetchORSAutocomplete(query, limit, signal);
  }
  return fetchNominatimSearch(query, limit, signal);
}

async function fetchPlaceGeocode(
  query: string,
  signal?: AbortSignal
): Promise<NormalizedPlace | null> {
  if (ORS_API_KEY) {
    const results = await fetchORSGeocode(query, 1, signal);
    return results[0] || null;
  }
  const results = await fetchNominatimSearch(query, 1, signal);
  return results[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useNominatimSearch(query: string) {
  return useQuery<NormalizedPlace[], Error>({
    queryKey: mapKeys.search(query),
    queryFn: ({ signal }) => fetchPlaceSearch(query, undefined, signal),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useNominatimGeocode(address: string) {
  return useQuery<NormalizedPlace | null, Error>({
    queryKey: mapKeys.geocode(address),
    queryFn: ({ signal }) => fetchPlaceGeocode(address, signal),
    enabled: address.length >= 2,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useDatabaseBusinessSearch(query: string) {
  return useQuery<NormalizedPlace[], Error>({
    queryKey: [...mapKeys.search(query), "database"],
    queryFn: async ({ signal }) => {
      const response = await businessApi.searchBusinesses(query, 10, signal);
      return response.data.map(normalizeBusinessPlace);
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
