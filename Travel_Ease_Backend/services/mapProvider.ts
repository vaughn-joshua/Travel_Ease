/**
 * Map provider service - normalizes geocode/search/route operations
 * Supports Nominatim (free) and Mapbox (production)
 */

import axios from 'axios';
import mapConfig from '../config/map_config.js';
import { createCacheKey, getCache } from './cache.js';

const { nominatim, osrm, mapbox, cache: cacheConfig } = mapConfig;

interface Coordinates {
  lat: number;
  lng: number;
}

interface NormalizedPlace {
  placeId: string | null;
  label: string;
  coordinates: Coordinates;
  type: string | null;
  address: unknown;
  boundingBox: number[] | null;
}

interface NormalizedRoute {
  distance: number;
  duration: number;
  durationFormatted: string;
  distanceFormatted: string;
  geometry: unknown;
  legs: Array<{
    distance: number;
    duration: number;
    summary: string;
    steps?: Array<{
      instruction: string;
      distance: number;
      duration: number;
      name: string;
    }>;
  }>;
}

interface CacheResult<T> {
  data: T;
  fromCache: boolean;
}

interface NominatimResult {
  place_id?: number;
  display_name?: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: unknown;
  boundingbox?: string[];
}

interface MapboxFeature {
  id?: string;
  place_name?: string;
  text?: string;
  center?: [number, number];
  place_type?: string[];
  properties?: { address?: string };
  bbox?: number[];
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: unknown;
  legs?: Array<{
    distance: number;
    duration: number;
    summary?: string;
    steps?: Array<{
      maneuver?: { instruction?: string };
      distance: number;
      duration: number;
      name?: string;
    }>;
  }>;
}

interface OSRMResponse {
  code: string;
  routes?: OSRMRoute[];
}

/**
 * Normalize a place result to consistent format
 */
function normalizePlace(raw: NominatimResult | MapboxFeature, provider = 'nominatim'): NormalizedPlace {
  if (provider === 'nominatim') {
    const r = raw as NominatimResult;
    return {
      placeId: r.place_id?.toString() || null,
      label: r.display_name || '',
      coordinates: {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      },
      type: r.type || r.class || null,
      address: r.address || null,
      boundingBox: r.boundingbox
        ? r.boundingbox.map(parseFloat)
        : null,
    };
  }
  
  if (provider === 'mapbox') {
    const r = raw as MapboxFeature;
    const [lng, lat] = r.center || [0, 0];
    return {
      placeId: r.id || null,
      label: r.place_name || r.text || '',
      coordinates: { lat, lng },
      type: r.place_type?.[0] || null,
      address: r.properties?.address || null,
      boundingBox: r.bbox || null,
    };
  }
  
  return raw as unknown as NormalizedPlace;
}

/**
 * Normalize a route result to consistent format
 */
function normalizeRoute(raw: OSRMResponse, provider = 'osrm'): NormalizedRoute | null {
  if ((provider === 'osrm' || provider === 'mapbox') && raw.routes?.[0]) {
    const route = raw.routes[0];
    return {
      distance: Math.round(route.distance), // meters
      duration: Math.round(route.duration), // seconds
      durationFormatted: formatDuration(route.duration),
      distanceFormatted: formatDistance(route.distance),
      geometry: route.geometry,
      legs: route.legs?.map(leg => ({
        distance: Math.round(leg.distance),
        duration: Math.round(leg.duration),
        summary: leg.summary || '',
        steps: leg.steps?.map(step => ({
          instruction: step.maneuver?.instruction || '',
          distance: step.distance,
          duration: step.duration,
          name: step.name || '',
        })),
      })) || [],
    };
  }
  
  return null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

interface SearchOptions {
  limit?: number;
  region?: string;
}

/**
 * Search for places by query
 */
export async function searchPlaces(query: string, options: SearchOptions = {}): Promise<CacheResult<NormalizedPlace[]>> {
  const { limit = 10, region } = options;
  const cacheKey = { q: query, limit, region };
  const ttl = cacheConfig.ttl.search;
  
  const cache = getCache('search');
  const key = createCacheKey('search', cacheKey);
  const cached = cache.get(key) as NormalizedPlace[] | undefined;
  
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  const provider = mapConfig.provider;
  let results: NormalizedPlace[] = [];
  
  try {
    if (provider === 'nominatim' || !mapbox.accessToken) {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: limit.toString(),
      });
      if (region) {
        params.append('countrycodes', region);
      }
      
      const response = await axios.get<NominatimResult[]>(
        `${nominatim.baseUrl}/search?${params}`,
        { headers: { 'User-Agent': nominatim.userAgent } }
      );
      
      results = response.data.map(r => normalizePlace(r, 'nominatim'));
    } else {
      const params = new URLSearchParams({
        access_token: mapbox.accessToken,
        limit: limit.toString(),
        types: 'place,address,poi',
      });
      if (region) {
        params.append('country', region);
      }
      
      const response = await axios.get<{ features: MapboxFeature[] }>(
        `${mapbox.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
      );
      
      results = response.data.features.map(r => normalizePlace(r, 'mapbox'));
    }
    
    cache.set(key, results, ttl);
    return { data: results, fromCache: false };
  } catch (error) {
    throw mapProviderError(error);
  }
}

/**
 * Get place suggestions for autocomplete
 */
export async function getSuggestions(query: string, options: SearchOptions = {}): Promise<CacheResult<NormalizedPlace[]>> {
  // For Nominatim, suggestions are same as search but faster/lighter
  return searchPlaces(query, { ...options, limit: options.limit || 5 });
}

/**
 * Geocode an address to coordinates
 */
export async function geocode(address: string): Promise<CacheResult<NormalizedPlace | null>> {
  const cache = getCache('geocode');
  const key = createCacheKey('geocode', { address });
  const cached = cache.get(key) as NormalizedPlace | undefined;
  
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  const ttl = cacheConfig.ttl.geocode;
  
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '1',
    });
    
    const response = await axios.get<NominatimResult[]>(
      `${nominatim.baseUrl}/search?${params}`,
      { headers: { 'User-Agent': nominatim.userAgent } }
    );
    
    if (!response.data || response.data.length === 0) {
      return { data: null, fromCache: false };
    }
    
    const result = normalizePlace(response.data[0], 'nominatim');
    cache.set(key, result, ttl);
    return { data: result, fromCache: false };
  } catch (error) {
    throw mapProviderError(error);
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<CacheResult<NormalizedPlace | null>> {
  const cache = getCache('geocode');
  const key = createCacheKey('reverse', { lat: lat.toFixed(6), lng: lng.toFixed(6) });
  const cached = cache.get(key) as NormalizedPlace | undefined;
  
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  const ttl = cacheConfig.ttl.geocode;
  
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    });
    
    const response = await axios.get<NominatimResult & { error?: string }>(
      `${nominatim.baseUrl}/reverse?${params}`,
      { headers: { 'User-Agent': nominatim.userAgent } }
    );
    
    if (!response.data || response.data.error) {
      return { data: null, fromCache: false };
    }
    
    const result = normalizePlace(response.data, 'nominatim');
    cache.set(key, result, ttl);
    return { data: result, fromCache: false };
  } catch (error) {
    throw mapProviderError(error);
  }
}

interface RouteOptions {
  profile?: 'driving' | 'walking' | 'cycling';
}

/**
 * Get route between two points
 */
export async function getRoute(
  origin: Coordinates, 
  destination: Coordinates, 
  options: RouteOptions = {}
): Promise<CacheResult<NormalizedRoute | null>> {
  const { profile = 'driving' } = options;
  
  const cache = getCache('route');
  const key = createCacheKey('route', {
    olat: origin.lat.toFixed(5),
    olng: origin.lng.toFixed(5),
    dlat: destination.lat.toFixed(5),
    dlng: destination.lng.toFixed(5),
    profile,
  });
  const cached = cache.get(key) as NormalizedRoute | undefined;
  
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  const ttl = cacheConfig.ttl.route;
  
  try {
    // OSRM profile mapping
    const osrmProfile = profile === 'walking' ? 'foot' : 
                        profile === 'cycling' ? 'bike' : 'car';
    
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    
    const response = await axios.get<OSRMResponse>(
      `${osrm.baseUrl}/route/v1/${osrmProfile}/${coords}`,
      {
        params: {
          overview: 'full',
          geometries: 'geojson',
          steps: 'true',
        },
      }
    );
    
    if (response.data.code !== 'Ok') {
      return { data: null, fromCache: false };
    }
    
    const result = normalizeRoute(response.data, 'osrm');
    if (result) {
      cache.set(key, result, ttl);
    }
    return { data: result, fromCache: false };
  } catch (error) {
    throw mapProviderError(error);
  }
}

interface MapError extends Error {
  statusCode?: number;
  code?: string;
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

/**
 * Transform provider errors to standardized format
 */
function mapProviderError(error: unknown): MapError {
  const axiosError = error as MapError;
  const status = axiosError.response?.status;
  const message = axiosError.response?.data?.message || axiosError.message;
  
  const err: MapError = new Error(message);
  
  if (status === 429) {
    err.statusCode = 429;
    err.code = 'RATE_LIMITED';
    err.message = 'Map provider rate limit exceeded. Please try again later.';
  } else if (status && status >= 500) {
    err.statusCode = 502;
    err.code = 'PROVIDER_ERROR';
    err.message = 'Map provider is temporarily unavailable.';
  } else if (status === 400) {
    err.statusCode = 400;
    err.code = 'INVALID_REQUEST';
  } else {
    err.statusCode = status || 500;
    err.code = 'MAP_ERROR';
  }
  
  return err;
}

export default {
  searchPlaces,
  getSuggestions,
  geocode,
  reverseGeocode,
  getRoute,
};

