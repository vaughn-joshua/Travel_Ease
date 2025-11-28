/**
 * Map API Routes - /api/map/*
 * Provides geocoding, search, suggestions, reverse geocode, and routing
 */

import { Router } from "express";
import { z } from "zod";
import mapProvider from "../services/mapProvider.js";
import { mapRateLimiter } from "../src/middleware/rateLimiter.js";

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
router.post("/search", async (req, res) => {
  try {
    const parsed = searchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
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
router.get("/search", async (req, res) => {
  try {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
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
router.get("/suggestions", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const limit = parseInt(req.query.limit) || 5;
    const region = req.query.region;
    
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
router.get("/geocode", async (req, res) => {
  try {
    const parsed = geocodeSchema.safeParse({ address: req.query.address || req.query.query });
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await mapProvider.geocode(parsed.data.address);

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: "Address not found" });
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
router.get("/reverse", async (req, res) => {
  try {
    const parsed = reverseSchema.safeParse({
      lat: req.query.lat,
      lng: req.query.lng || req.query.lon,
    });
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await mapProvider.reverseGeocode(parsed.data.lat, parsed.data.lng);

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: "Location not found" });
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
router.post("/route", async (req, res) => {
  try {
    const parsed = routeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { origin, destination, profile } = parsed.data;
    const result = await mapProvider.getRoute(origin, destination, { profile });

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: "Route not found" });
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
router.get("/route", async (req, res) => {
  try {
    const origin = {
      lat: parseFloat(req.query.olat),
      lng: parseFloat(req.query.olng),
    };
    const destination = {
      lat: parseFloat(req.query.dlat),
      lng: parseFloat(req.query.dlng),
    };
    const profile = req.query.profile || 'driving';

    const parsed = routeSchema.safeParse({ origin, destination, profile });
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await mapProvider.getRoute(origin, destination, { profile });

    res.set('X-Cache', result.fromCache ? 'HIT' : 'MISS');
    
    if (!result.data) {
      return res.status(404).json({ error: "Route not found" });
    }
    
    res.json({ route: result.data });
  } catch (error) {
    handleMapError(error, res);
  }
});

/**
 * Handle map provider errors consistently
 */
function handleMapError(error, res) {
  console.error('Map API error:', error.message);
  
  const statusCode = error.statusCode || 500;
  const code = error.code || 'MAP_ERROR';
  
  res.status(statusCode).json({
    error: error.message || 'Map service error',
    code,
  });
}

export default router;
