/**
 * Map provider service - normalizes geocode/search/route operations
 * Supports Nominatim (free) and Mapbox (production)
 */

import axios from 'axios';
import mapConfig from '../config/map_config.js';
import { withCache, createCacheKey, getCache } from './cache.js';

const { nominatim, osrm, mapbox, cache: cacheConfig } = mapConfig;

/**
 * Normalize a place result to consistent format
 * @param {object} raw - Raw provider response
 * @param {string} provider - Provider name
 * @returns {object} Normalized place
 */
function normalizePlace(raw, provider = 'nominatim') {
  if (provider === 'nominatim') {
    return {
      placeId: raw.place_id?.toString() || null,
      label: raw.display_name || '',
      coordinates: {
        lat: parseFloat(raw.lat),
        lng: parseFloat(raw.lon),
      },
      type: raw.type || raw.class || null,
      address: raw.address || null,
      boundingBox: raw.boundingbox
        ? raw.boundingbox.map(parseFloat)
        : null,
    };
  }
  
  if (provider === 'mapbox') {
    const [lng, lat] = raw.center || [0, 0];
    return {
      placeId: raw.id || null,
      label: raw.place_name || raw.text || '',
      coordinates: { lat, lng },
      type: raw.place_type?.[0] || null,
      address: raw.properties?.address || null,
      boundingBox: raw.bbox || null,
    };
  }
  
  return raw;
}

/**
 * Normalize a route result to consistent format
 * @param {object} raw - Raw provider response
 * @param {string} provider - Provider name
 * @returns {object} Normalized route
 */
function normalizeRoute(raw, provider = 'osrm') {
  if (provider === 'osrm' && raw.routes?.[0]) {
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
      })),
    };
  }
  
  if (provider === 'mapbox' && raw.routes?.[0]) {
    const route = raw.routes[0];
    return {
      distance: Math.round(route.distance),
      duration: Math.round(route.duration),
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
      })),
    };
  }
  
  return raw;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Search for places by query
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results with cache info
 */
export async function searchPlaces(query, options = {}) {
  const { limit = 10, region } = options;
  const cacheKey = { q: query, limit, region };
  const ttl = cacheConfig.ttl.search;
  
  const cache = getCache('search');
  const key = createCacheKey('search', cacheKey);
  const cached = cache.get(key);
  
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  const provider = mapConfig.provider;
  let results = [];
  
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
      
      const response = await axios.get(
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
      
      const response = await axios.get(
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
 * @param {string} query - Partial query
 * @param {object} options - Options
 * @returns {Promise<object>} Suggestions with cache info
 */
export async function getSuggestions(query, options = {}) {
  // For Nominatim, suggestions are same as search but faster/lighter
  return searchPlaces(query, { ...options, limit: options.limit || 5 });
}

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<object>} Geocode result with cache info
 */
export async function geocode(address) {
  const cache = getCache('geocode');
  const key = createCacheKey('geocode', { address });
  const cached = cache.get(key);
  
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
    
    const response = await axios.get(
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
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} Reverse geocode result with cache info
 */
export async function reverseGeocode(lat, lng) {
  const cache = getCache('geocode');
  const key = createCacheKey('reverse', { lat: lat.toFixed(6), lng: lng.toFixed(6) });
  const cached = cache.get(key);
  
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
    
    const response = await axios.get(
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

/**
 * Get route between two points
 * @param {object} origin - Origin coordinates {lat, lng}
 * @param {object} destination - Destination coordinates {lat, lng}
 * @param {object} options - Route options
 * @returns {Promise<object>} Route result with cache info
 */
export async function getRoute(origin, destination, options = {}) {
  const { profile = 'driving' } = options;
  
  const cache = getCache('route');
  const key = createCacheKey('route', {
    olat: origin.lat.toFixed(5),
    olng: origin.lng.toFixed(5),
    dlat: destination.lat.toFixed(5),
    dlng: destination.lng.toFixed(5),
    profile,
  });
  const cached = cache.get(key);
  
  if (cached !== undefined) {
    return { data: cached, fromCache: true };
  }
  
  const ttl = cacheConfig.ttl.route;
  
  try {
    // OSRM profile mapping
    const osrmProfile = profile === 'walking' ? 'foot' : 
                        profile === 'cycling' ? 'bike' : 'car';
    
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    
    const response = await axios.get(
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
    cache.set(key, result, ttl);
    return { data: result, fromCache: false };
  } catch (error) {
    throw mapProviderError(error);
  }
}

/**
 * Transform provider errors to standardized format
 * @param {Error} error - Original error
 * @returns {Error} Standardized error
 */
function mapProviderError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message;
  
  const err = new Error(message);
  
  if (status === 429) {
    err.statusCode = 429;
    err.code = 'RATE_LIMITED';
    err.message = 'Map provider rate limit exceeded. Please try again later.';
  } else if (status >= 500) {
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

