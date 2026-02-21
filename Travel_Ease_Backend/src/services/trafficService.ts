
import { prisma, executeWithRetry } from '../lib/prismaHelpers.js';
import mapProvider from './mapProvider.js';
import { mapLogger } from '../lib/logger.js';

// Configuration
const TRAFFIC_MULTIPLIERS = {
    weekday: 1.25, // Heavier traffic
    weekend: 1.35, // Tourist congestion (updated per requirement)
};

interface ZoneSnapshotResult {
    origin_zone_id: number;
    destination_zone_id: number;
    base_distance_km: number;
    base_duration_min: number;
    weekday_eta_min: number;
    weekend_eta_min: number;
}

/**
 * Generate traffic snapshots between all zones
 * Upserts 72 records (6x6 zones * 2 day groups)
 */
export async function generateTrafficSnapshots(): Promise<string> {
    mapLogger.info({}, 'Starting traffic snapshot generation...');
    const startTime = Date.now();

    try {
        // 1. Fetch all zones
        const zones = await prisma.zone.findMany({
            orderBy: { zone_id: 'asc' }
        });

        if (zones.length === 0) {
            throw new Error('No zones found. Please seed zones first.');
        }

        let processedCount = 0;
        const errors: string[] = [];

        // 2. Loop through all zone pairs
        for (const origin of zones) {
            for (const dest of zones) {
                try {
                    // Skip route calculation if coordinates are missing (shouldn't happen if seeded)
                    if (!origin.centroid_lat || !origin.centroid_lng || !dest.centroid_lat || !dest.centroid_lng) {
                        mapLogger.warn(`Missing centroid for Zone ${origin.zone_id} or ${dest.zone_id}`);
                        continue;
                    }

                    // 3. Calculate Base Route via OSRM
                    // Note: Intra-zone (same zone) might return 0 distance/duration or very small.
                    // OSRM handles same coordinates by returning 0.

                    let distanceKm = 0;
                    let durationMin = 0;

                    if (origin.zone_id === dest.zone_id) {
                        // Intra-zone: estimated as small constant or 0 (user said include self-loops)
                        // Let's rely on OSRM for now, but maybe add a minimal buffer for internal travel?
                        // Prompt implied "Reuse OSRM", so we'll query it even for same point to see what happens,
                        // or optimization: just set to 0. 
                        // Actually, centroid to centroid is 0 distance. 
                        // Accessing API with same start/end returns 0.
                        // For a "Zone Traffic Snapshot", 0 minutes to travel within zone centroid seems right basically,
                        // although real intra-zone travel takes time.
                        // Given "Reuse OSRM" strictness, I will query it.
                        // But actually, querying OSRM for same coord is wasteful. I'll just set 0.
                        distanceKm = 0;
                        durationMin = 0;
                    } else {
                        const route = await mapProvider.getRoute(
                            { lat: origin.centroid_lat, lng: origin.centroid_lng },
                            { lat: dest.centroid_lat, lng: dest.centroid_lng },
                            { profile: 'driving' }
                        );

                        if (route.data) {
                            distanceKm = route.data.distance / 1000; // meters to km
                            durationMin = route.data.duration / 60;   // seconds to minutes
                        } else {
                            mapLogger.warn(`No route found between Zone ${origin.zone_id} and ${dest.zone_id}`);
                        }
                    }

                    // 4. Calculate ETAs
                    const weekdayEta = durationMin * TRAFFIC_MULTIPLIERS.weekday;
                    const weekendEta = durationMin * TRAFFIC_MULTIPLIERS.weekend;

                    // 5. Upsert Weekday Snapshot
                    await upsertSnapshot(origin.zone_id, dest.zone_id, 'weekday', distanceKm, weekdayEta);

                    // 6. Upsert Weekend Snapshot
                    await upsertSnapshot(origin.zone_id, dest.zone_id, 'weekend', distanceKm, weekendEta);

                    processedCount++;
                } catch (error) {
                    const msg = `Failed to process Zone ${origin.zone_id} -> ${dest.zone_id}: ${error instanceof Error ? error.message : String(error)}`;
                    mapLogger.error(msg);
                    errors.push(msg);
                }
            }
        }

        const duration = (Date.now() - startTime) / 1000;
        return `Traffic snapshots generated successfully. Processed ${processedCount} pairs (${processedCount * 2} records) in ${duration.toFixed(1)}s. Errors: ${errors.length}`;

    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}

/**
 * Upsert a single snapshot record
 */
async function upsertSnapshot(
    originId: number,
    destId: number,
    dayGroup: string,
    distance: number,
    eta: number
) {
    // We can use a composite unique key if one exists, but Prisma schema defined:
    // @@index([origin_zone_id, destination_zone_id, day_group])
    // It didn't define a unique constraint, but strictly logically it should be unique.
    // We should check if we can FindFirst then Update, or Create.
    // Ideally, we add a unique constraint in schema, but for now I'll use findFirst.

    // Wait, if I want to "Overwrite old snapshot if exists", I need to find it by (origin, dest, day).

    const existing = await prisma.zone_traffic_snapshot.findFirst({
        where: {
            origin_zone_id: originId,
            destination_zone_id: destId,
            day_group: dayGroup
        }
    });

    if (existing) {
        await prisma.zone_traffic_snapshot.update({
            where: { id: existing.id },
            data: {
                avg_distance_km: distance,
                avg_eta_minutes: eta,
                last_updated: new Date()
            }
        });
    } else {
        await prisma.zone_traffic_snapshot.create({
            data: {
                origin_zone_id: originId,
                destination_zone_id: destId,
                day_group: dayGroup,
                avg_distance_km: distance,
                avg_eta_minutes: eta
            }
        });
    }
}

/**
 * Fetch alternative businesses in a specific zone that match a main category.
 * Used for traffic-aware suggestions.
 */
import { category } from '@prisma/client';
import { getZoneForCoordinates } from './zoneService.js';
import { formatBusinessListItem } from './businessService.js';

export async function getAlternativeBusinesses(
    zoneId: number,
    mainCategory: category | null,
    limit: number = 3
) {
    let alternatives = [];

    // 1. Fetch businesses matching the main category and are APPROVED
    if (mainCategory) {
        const businesses = await prisma.business.findMany({
            where: {
                status: { in: ['APPROVED', 'LGU_REGISTERED'] },
                business_category: {
                    some: {
                        subcategory: {
                            main_category: mainCategory
                        }
                    }
                },
                latitude: { not: null },
                longtitude: { not: null }
            },
            include: {
                business_category: {
                    include: { subcategory: true }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        });

        // 2. Filter businesses by checking if their coordinates fall into the requested zone
        for (const b of businesses) {
            if (alternatives.length >= limit) break;

            const bZone = await getZoneForCoordinates(b.latitude!, b.longtitude!);
            if (bZone === zoneId) {
                alternatives.push(formatBusinessListItem(b));
            }
        }

        mapLogger.info(`Found ${alternatives.length} alternatives via category: ${mainCategory} in Zone ${zoneId}`);
    }

    // 3. FALLBACK: If no alternatives found for the exact category, find ANY highly-rated business in the zone
    if (alternatives.length === 0) {
        mapLogger.info(`Fallback triggered for Zone ${zoneId}. Looking for any top-rated businesses.`);

        const anyBusinesses = await prisma.business.findMany({
            where: {
                status: { in: ['APPROVED', 'LGU_REGISTERED'] },
                latitude: { not: null },
                longtitude: { not: null }
            },
            include: {
                business_category: {
                    include: { subcategory: true }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        });

        for (const b of anyBusinesses) {
            if (alternatives.length >= limit) break;

            const bZone = await getZoneForCoordinates(b.latitude!, b.longtitude!);
            if (bZone === zoneId) {
                alternatives.push(formatBusinessListItem(b));
            }
        }
        mapLogger.info(`Found ${alternatives.length} alternatives via fallback in Zone ${zoneId}`);
    }

    return alternatives;
}

