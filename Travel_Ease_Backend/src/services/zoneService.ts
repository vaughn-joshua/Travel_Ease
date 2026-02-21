
import { prisma } from '../lib/prismaHelpers.js';

interface Point {
    lat: number;
    lng: number;
}

interface Zone {
    zone_id: number;
    zone_name: string;
    boundary_coordinates: Point[];
}

let cachedZones: Zone[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Get all zones from DB (cached)
 */
export async function getAllZones(): Promise<Zone[]> {
    const now = Date.now();
    if (cachedZones && (now - lastCacheUpdate < CACHE_TTL)) {
        return cachedZones;
    }

    const zones = await prisma.zone.findMany();

    // Transform Json to Point[]
    cachedZones = zones.map(zone => ({
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        boundary_coordinates: zone.boundary_coordinates as any as Point[] // Trusting the structure
    }));

    lastCacheUpdate = now;
    return cachedZones;
}

/**
 * Check if a point is inside a polygon using Ray Casting algorithm
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        const intersect = ((yi > point.lng) !== (yj > point.lng))
            && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Get the zone for a given coordinate
 * Returns null if outside all zones
 */
export async function getZoneForCoordinates(lat: number, lng: number): Promise<number | null> {
    const zones = await getAllZones();

    for (const zone of zones) {
        if (isPointInPolygon({ lat, lng }, zone.boundary_coordinates)) {
            return zone.zone_id;
        }
    }

    return null;
}

/**
 * Get the zone for a business by ID
 * Returns null if business not found or outside all zones
 */
export async function getZoneForBusiness(businessId: number): Promise<number | null> {
    const business = await prisma.business.findUnique({
        where: { business_id: businessId },
        select: { latitude: true, longtitude: true } // Note: DB column typo 'longtitude'
    });

    if (!business || business.latitude === null || business.longtitude === null) {
        return null;
    }

    return getZoneForCoordinates(business.latitude, business.longtitude);
}
