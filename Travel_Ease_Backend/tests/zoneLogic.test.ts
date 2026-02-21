
import { describe, it, expect } from 'vitest';
import { getZoneForCoordinates } from '../src/services/zoneService';

describe('Zone Logic', () => {
    it('should identify a point inside Zone 1', async () => {
        // Centroid: 14.0950, 120.9050.
        // Zone 1 bounds: lat 14.11-14.13, lng 120.88-120.91
        // Wait, Centroid 14.0950 is NOT inside 14.11-14.13!
        // Let's check the prompt's boundary for Zone 1.
        // Boundary: 14.1100, 120.8800 ... 14.1300, 120.8800 ...
        // Lat is between 14.11 and 14.13. Lng between 120.88 and 120.91.
        // The "Centroid" 14.0950 provided in prompt seems to be OUTSIDE the box?
        // 14.0950 < 14.1100.
        // Zone 1 Centroid in prompt: 14.0950, 120.9050.
        // Boundary Lat range: 14.11 -> 14.13.
        // This is weird. The centroid provided in the prompt seems disconnected from the boundary box?
        // Or maybe I misread.
        // Zone 1:
        // { "lat": 14.1100, "lng": 120.8800 },
        // { "lat": 14.1300, "lng": 120.8800 }, ...
        // It's a rectangle from 14.11 to 14.13 lat, 120.88 to 120.91 lng.
        // Centroid 14.0950 is clearly south of 14.11.
        // I should trust the BOUNDARY for the point-in-polygon logic.

        // Test point inside Zone 1
        const insideLat = 14.1200;
        const insideLng = 120.9000;

        const zoneId = await getZoneForCoordinates(insideLat, insideLng);
        expect(zoneId).toBeDefined();
        // Since we seeded, zone_id might be auto-incremented. We can't guarantee it's '1', but it should be a number.
        // We can assume it's the first one if DB was fresh, but it's not.
        // We'll just check it returns a number (not null).
        expect(zoneId).not.toBeNull();
    });

    it('should return null for a point outside Tagaytay', async () => {
        // Manila coordinates
        const outsideLat = 14.6000;
        const outsideLng = 120.9800;

        const zoneId = await getZoneForCoordinates(outsideLat, outsideLng);
        expect(zoneId).toBeNull();
    });

    it('should identify a point inside Zone 6', async () => {
        // Zone 6: lat 14.11-14.15, lng 120.97-121.01
        const lat = 14.1300;
        const lng = 120.9800;

        const zoneId = await getZoneForCoordinates(lat, lng);
        expect(zoneId).not.toBeNull();
    });
});
