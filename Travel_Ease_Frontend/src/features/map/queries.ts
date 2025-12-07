/**
 * Map Query Hooks
 *
 * TanStack Query hooks for caching external Nominatim geocoding API calls.
 * These hooks reduce redundant API calls by caching search results.
 *
 * External API: https://nominatim.openstreetmap.org
 * Rate Limit: 1 request/second (caching helps avoid hitting this limit)
 */

import { useQuery } from "@tanstack/react-query";
import { mapKeys } from "../../lib/queryKeys";
import type { NominatimPlace, NormalizedPlace } from "../../types/map";
import { businessApi } from "../../services/api";

// Tagaytay City viewbox bounds (west, north, east, south)
const TAGAYTAY_VIEWBOX = "120.92,14.15,120.97,14.07";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize Nominatim response to internal format
// ─────────────────────────────────────────────────────────────────────────────
function normalizeNominatimPlace(place: NominatimPlace): NormalizedPlace {
  const parts = (place.display_name || "").split(",").map((p) => p.trim());
  return {
    id: place.place_id?.toString() || "",
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize database business to NormalizedPlace format
// ─────────────────────────────────────────────────────────────────────────────
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
  // Build full label from available address components
  const addressParts: string[] = [];
  if (business.house_number) addressParts.push(business.house_number);
  if (business.street) addressParts.push(business.street);
  if (business.brgy) addressParts.push(business.brgy);
  if (business.city) addressParts.push(business.city);
  
  const fullLabel = addressParts.length > 0
    ? `${business.name}, ${addressParts.join(", ")}`
    : business.name;

  return {
    id: `business_${business.business_id}`,
    name: business.name,
    fullLabel: fullLabel,
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
// Helper: Fetch from Nominatim API
// ─────────────────────────────────────────────────────────────────────────────
async function fetchNominatimSearch(
  query: string,
  limit?: number,
  signal?: AbortSignal
): Promise<NormalizedPlace[]> {
  const limitParam = limit ? `&limit=${limit}` : "";
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=${TAGAYTAY_VIEWBOX}${limitParam}`;

  const response = await fetch(nominatimUrl, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment.");
    }
    throw new Error("Failed to fetch search results");
  }

  const data: NominatimPlace[] = await response.json();
  return data.map(normalizeNominatimPlace);
}

// ─────────────────────────────────────────────────────────────────────────────
// useNominatimSearch
// Fetches and caches search suggestions from Nominatim.
// Results are cached for 5 minutes to reduce redundant API calls.
// ─────────────────────────────────────────────────────────────────────────────
export function useNominatimSearch(query: string) {
  return useQuery<NormalizedPlace[], Error>({
    queryKey: mapKeys.search(query),
    queryFn: ({ signal }) => fetchNominatimSearch(query, undefined, signal),
    // Only enable query when there's a meaningful search term
    enabled: query.length >= 2,
    // Cache results for 5 minutes (300,000ms)
    staleTime: 1000 * 60 * 5,
    // Keep in cache for 30 minutes even after component unmounts
    gcTime: 1000 * 60 * 30,
    // Don't retry on error (likely rate limit or no results)
    retry: false,
    // Don't refetch on window focus for search results
    refetchOnWindowFocus: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useNominatimGeocode
// Fetches a single geocode result for an address.
// Results are cached for 10 minutes.
// ─────────────────────────────────────────────────────────────────────────────
export function useNominatimGeocode(address: string) {
  return useQuery<NormalizedPlace | null, Error>({
    queryKey: mapKeys.geocode(address),
    queryFn: async ({ signal }) => {
      const results = await fetchNominatimSearch(address, 1, signal);
      return results[0] || null;
    },
    // Only enable when address is provided
    enabled: address.length >= 2,
    // Cache results for 10 minutes
    staleTime: 1000 * 60 * 10,
    // Keep in cache for 1 hour
    gcTime: 1000 * 60 * 60,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useDatabaseBusinessSearch
// Fetches and caches business search results from the database.
// Results are cached for 10 minutes (longer than Nominatim since they change less frequently).
// ─────────────────────────────────────────────────────────────────────────────
export function useDatabaseBusinessSearch(query: string) {
  return useQuery<NormalizedPlace[], Error>({
    queryKey: [...mapKeys.search(query), "database"],
    queryFn: async ({ signal }) => {
      const response = await businessApi.searchBusinesses(query, 10, signal);
      return response.data.map(normalizeBusinessPlace);
    },
    // Only enable query when there's a meaningful search term
    enabled: query.length >= 2,
    // Cache results for 10 minutes (longer than Nominatim since DB changes less)
    staleTime: 1000 * 60 * 10,
    // Keep in cache for 1 hour
    gcTime: 1000 * 60 * 60,
    // Retry once on error
    retry: 1,
    // Don't refetch on window focus for search results
    refetchOnWindowFocus: false,
  });
}
