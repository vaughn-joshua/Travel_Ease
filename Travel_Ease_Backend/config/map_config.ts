/**
 * Map provider configuration
 * Supports Nominatim (free) and Mapbox (production)
 */

export interface MapConfig {
  provider: string;
  nominatim: {
    baseUrl: string;
    userAgent: string;
  };
  osrm: {
    baseUrl: string;
  };
  mapbox: {
    baseUrl: string;
    accessToken: string | undefined;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cache: {
    ttl: {
      search: number;
      geocode: number;
      route: number;
    };
  };
}

export const mapConfig: MapConfig = {
  provider: process.env.MAP_PROVIDER || 'nominatim',
  
  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    userAgent: 'TravelEase/1.0', // Required by Nominatim TOS
  },
  
  osrm: {
    baseUrl: process.env.OSRM_BASE_URL || 'https://router.project-osrm.org',
  },
  
  mapbox: {
    baseUrl: process.env.MAPBOX_BASE_URL || 'https://api.mapbox.com',
    accessToken: process.env.MAPBOX_ACCESS_TOKEN,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.MAP_RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.MAP_RATE_LIMIT_MAX || '30'),
  },
  
  cache: {
    ttl: {
      search: parseInt(process.env.CACHE_TTL_SEARCH || '300'),
      geocode: parseInt(process.env.CACHE_TTL_GEOCODE || '86400'),
      route: parseInt(process.env.CACHE_TTL_ROUTE || '120'),
    },
  },
};

export default mapConfig;

