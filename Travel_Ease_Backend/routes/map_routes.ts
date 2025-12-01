/**
 * Map API Routes - /api/map/*
 * Provides geocoding, search, suggestions, reverse geocode, and routing
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mapProvider from '../services/mapProvider.js';
import { mapRateLimiter } from '../src/middleware/rateLimiter.js';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  region: z.string().length(2).optional(), // ISO country code
});

const geocodeSchema = z.object({
  address: z.string().min(1).max(500),
});

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const routeSchema = z.object({
  origin: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
  destination: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
  profile: z.enum(['driving', 'walking', 'cycling']).optional(),
});

// Apply rate limiter to all map routes
router.use(mapRateLimiter);

/**
 * POST /api/map/search - Search for places
 * Body: { query, limit?, region? }
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { query, limit, region } = parsed.data;
    const result = await mapProvider.searchPlaces(query, { limit, region });

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    res.json({ places: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * GET /api/map/search - Search for places (query param)
 * Query: ?query=...&limit=...&region=...
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { query, limit, region } = parsed.data;
    const result = await mapProvider.searchPlaces(query, { limit, region });

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    res.json({ places: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * GET /api/map/suggestions - Get autocomplete suggestions
 * Query: ?query=...&limit=...
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string | undefined;
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const region = req.query.region as string | undefined;
    
    const result = await mapProvider.getSuggestions(query, { limit, region });

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    res.json({ suggestions: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * GET /api/map/geocode - Geocode an address
 * Query: ?address=...
 */
router.get('/geocode', async (req: Request, res: Response) => {
  try {
    const parsed = geocodeSchema.safeParse({ address: req.query.address || req.query.query });
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await mapProvider.geocode(parsed.data.address);

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    res.json({ place: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * GET /api/map/reverse - Reverse geocode coordinates
 * Query: ?lat=...&lng=...
 */
router.get('/reverse', async (req: Request, res: Response) => {
  try {
    const parsed = reverseSchema.safeParse({
      lat: req.query.lat,
      lng: req.query.lng || req.query.lon,
    });
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await mapProvider.reverseGeocode(parsed.data.lat, parsed.data.lng);

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ place: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * POST /api/map/route - Get route between two points
 * Body: { origin: {lat, lng}, destination: {lat, lng}, profile? }
 */
router.post('/route', async (req: Request, res: Response) => {
  try {
    const parsed = routeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { origin, destination, profile } = parsed.data;
    const result = await mapProvider.getRoute(
      parsed.data.origin as { lat: number; lng: number },
      parsed.data.destination as { lat: number; lng: number },
      { profile: parsed.data.profile as 'driving' | 'walking' | 'cycling' }
    );

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json({ route: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * GET /api/map/route - Get route between two points (query params)
 * Query: ?olat=...&olng=...&dlat=...&dlng=...&profile=...
 */
router.get('/route', async (req: Request, res: Response) => {
  try {
    const origin = {
      lat: parseFloat(req.query.olat as string),
      lng: parseFloat(req.query.olng as string),
    };
    const destination = {
      lat: parseFloat(req.query.dlat as string),
      lng: parseFloat(req.query.dlng as string),
    };
    const profile = (req.query.profile as string) || 'driving';

    const parsed = routeSchema.safeParse({ origin, destination, profile });
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await mapProvider.getRoute(
      parsed.data.origin as { lat: number; lng: number },
      parsed.data.destination as { lat: number; lng: number },
      { profile: parsed.data.profile as 'driving' | 'walking' | 'cycling' }
    );

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json({ route: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

interface MapError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Handle map provider errors consistently
 */
function handleMapError(error: unknown, res: Response) {
  const mapError = error as MapError;
  console.error('Map API error:', mapError.message);
  
  const statusCode = mapError.statusCode || 500;
  const code = mapError.code || 'MAP_ERROR';
  
  res.status(statusCode).json({
    error: mapError.message || 'Map service error',
    code,
  });
}

export default router;

