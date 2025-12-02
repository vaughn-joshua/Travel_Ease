/**
 * Map API Tests
 * Tests for /api/map/* endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import mapRoutes from '../routes/map_routes.js';

// Mock axios for external API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create test app
const app: Express = express();
app.use(express.json());
app.use('/api/map', mapRoutes);

describe('Map API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/map/search', () => {
    it('should return 400 if query is missing', async () => {
      const response = await request(app).get('/api/map/search');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
    });

    it('should return normalized places on success', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [
          {
            place_id: 123,
            display_name: 'Tagaytay City, Cavite, Philippines',
            lat: '14.1154',
            lon: '120.9620',
            type: 'city',
          },
        ],
      });

      const response = await request(app)
        .get('/api/map/search')
        .query({ query: 'Tagaytay' });

      expect(response.status).toBe(200);
      expect(response.body.places).toHaveLength(1);
      expect(response.body.places[0]).toMatchObject({
        placeId: '123',
        label: 'Tagaytay City, Cavite, Philippines',
        coordinates: { lat: 14.1154, lng: 120.962 },
      });
    });

    it('should include cache header', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const response = await request(app)
        .get('/api/map/search')
        .query({ query: 'NonExistent' });

      expect(response.headers['x-cache']).toBeDefined();
    });
  });

  describe('POST /api/map/search', () => {
    it('should search with POST body', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [
          {
            place_id: 456,
            display_name: "People's Park in the Sky, Tagaytay",
            lat: '14.105',
            lon: '120.975',
          },
        ],
      });

      const response = await request(app)
        .post('/api/map/search')
        .send({ query: "People's Park", limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.places).toHaveLength(1);
    });
  });

  describe('GET /api/map/suggestions', () => {
    it('should return empty array for short queries', async () => {
      const response = await request(app)
        .get('/api/map/suggestions')
        .query({ query: 'a' });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toEqual([]);
    });

    it('should return suggestions for valid query', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [
          { place_id: 1, display_name: 'Place 1', lat: '14.1', lon: '120.9' },
          { place_id: 2, display_name: 'Place 2', lat: '14.2', lon: '120.8' },
        ],
      });

      const response = await request(app)
        .get('/api/map/suggestions')
        .query({ query: 'Taga' });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toHaveLength(2);
    });
  });

  describe('GET /api/map/geocode', () => {
    it('should return 400 without address', async () => {
      const response = await request(app).get('/api/map/geocode');
      expect(response.status).toBe(400);
    });

    it('should return 404 when address not found', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });

      const response = await request(app)
        .get('/api/map/geocode')
        .query({ address: 'NonExistent Place' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Address not found');
    });

    it('should return geocoded place', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: [
          {
            place_id: 789,
            display_name: 'SM City Tagaytay',
            lat: '14.098',
            lon: '120.945',
            address: { city: 'Tagaytay' },
          },
        ],
      });

      const response = await request(app)
        .get('/api/map/geocode')
        .query({ address: 'SM City Tagaytay' });

      expect(response.status).toBe(200);
      expect(response.body.place).toMatchObject({
        placeId: '789',
        coordinates: { lat: 14.098, lng: 120.945 },
      });
    });
  });

  describe('GET /api/map/reverse', () => {
    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/map/reverse')
        .query({ lat: 'invalid', lng: 120 });

      expect(response.status).toBe(400);
    });

    it('should return 404 when location not found', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { error: 'Not found' } });

      const response = await request(app)
        .get('/api/map/reverse')
        .query({ lat: 14.1154, lng: 120.962 });

      expect(response.status).toBe(404);
    });

    it('should return reverse geocoded address', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          place_id: 999,
          display_name: 'Tagaytay Highlands',
          lat: '14.11',
          lon: '120.96',
        },
      });

      const response = await request(app)
        .get('/api/map/reverse')
        .query({ lat: 14.11, lng: 120.96 });

      expect(response.status).toBe(200);
      expect(response.body.place.label).toBe('Tagaytay Highlands');
    });
  });

  describe('POST /api/map/route', () => {
    it('should return 400 for invalid body', async () => {
      const response = await request(app)
        .post('/api/map/route')
        .send({ origin: { lat: 14.1 } }); // Missing lng and destination

      expect(response.status).toBe(400);
    });

    it('should return route with ETA and distance', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          code: 'Ok',
          routes: [
            {
              distance: 5000,
              duration: 600,
              geometry: {
                type: 'LineString',
                coordinates: [[120.94, 14.1], [120.96, 14.12]],
              },
              legs: [
                {
                  distance: 5000,
                  duration: 600,
                  summary: 'Test Route',
                  steps: [],
                },
              ],
            },
          ],
        },
      });

      const response = await request(app)
        .post('/api/map/route')
        .send({
          origin: { lat: 14.1, lng: 120.94 },
          destination: { lat: 14.12, lng: 120.96 },
        });

      expect(response.status).toBe(200);
      expect(response.body.route).toMatchObject({
        distance: 5000,
        duration: 600,
        distanceFormatted: '5.0 km',
        durationFormatted: '10 min',
      });
      expect(response.body.route.geometry).toBeDefined();
    });

    it('should return 404 when no route found', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { code: 'NoRoute' },
      });

      const response = await request(app)
        .post('/api/map/route')
        .send({
          origin: { lat: 0, lng: 0 },
          destination: { lat: 1, lng: 1 },
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/map/route', () => {
    it('should accept query parameters', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          code: 'Ok',
          routes: [
            {
              distance: 3000,
              duration: 300,
              geometry: { type: 'LineString', coordinates: [] },
              legs: [],
            },
          ],
        },
      });

      const response = await request(app)
        .get('/api/map/route')
        .query({
          olat: 14.1,
          olng: 120.94,
          dlat: 14.12,
          dlng: 120.96,
        });

      expect(response.status).toBe(200);
      expect(response.body.route).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      (mockedAxios.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

      const response = await request(app)
        .get('/api/map/search')
        .query({ query: 'test' });

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});

describe('Cache Utility', () => {
  it('should cache and retrieve values', async () => {
    const { getCache, createCacheKey } = await import('../services/cache.js');
    
    const cache = getCache('search');
    const key = createCacheKey('search', { q: 'test' });
    
    cache.set(key, { data: 'cached' }, 60);
    
    const result = cache.get(key);
    expect(result).toEqual({ data: 'cached' });
  });

  it('should respect TTL', async () => {
    const { getCache, createCacheKey } = await import('../services/cache.js');
    
    const cache = getCache('search');
    const key = createCacheKey('search', { q: 'expiring-ttl' });
    
    // Set with very short TTL (0.01 seconds = 10ms)
    cache.set(key, { data: 'expires' }, 0.01);
    
    // Wait longer than TTL
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const result = cache.get(key);
    expect(result).toBeUndefined();
  });

  it('should return undefined for missing keys', async () => {
    const { getCache } = await import('../services/cache.js');
    
    const cache = getCache('search');
    const result = cache.get('nonexistent-key');
    
    expect(result).toBeUndefined();
  });
});

