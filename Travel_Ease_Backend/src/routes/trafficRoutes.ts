
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateTrafficSnapshots, getAlternativeBusinesses } from '../services/trafficService.js';
import { mapLogger } from '../lib/logger.js';
import { prisma } from '../lib/prismaHelpers.js';

const router = Router();

// Middleware to require SUPER_ADMIN role
const requireSuperAdmin = (req: Request, res: Response, next: Function) => {
    // authenticateToken already sets req.user
    if (req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Permission denied. Super Admin role required.' });
    }
    next();
};

/**
 * POST /api/traffic/generate-snapshots
 * Trigger manual generation of traffic snapshots
 */
router.post(
    '/generate-snapshots',
    authenticateToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            // Run generation in background if we want to return early?
            // Or await it. The prompt says "Trigger manual refresh", user likely wants to know when it's done.
            // OSRM is fast, 72 pairs should be quick.

            const result = await generateTrafficSnapshots();

            res.json({
                message: 'Traffic snapshots generated successfully',
                details: result
            });
        } catch (error) {
            mapLogger.error({ error: String(error) }, 'Failed to generate traffic snapshots via API');
            res.status(500).json({
                error: 'Failed to generate traffic snapshots',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    }
);

/**
 * GET /api/traffic/alternative-suggestion
 * Fetch alternative activities if traffic between two activities is heavy (>30 mins)
 */
router.get(
    '/alternative-suggestion',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const { origin_activity_id, origin_lat, origin_lng, destination_activity_id, day_group = 'weekday' } = req.query;

            if ((!origin_activity_id && (!origin_lat || !origin_lng)) || !destination_activity_id) {
                return res.status(400).json({ error: 'Missing origin (activity_id or lat/lng) or destination_activity_id' });
            }

            // 1. Fetch activities to get zone_ids and destination category
            const dest = await prisma.activity.findUnique({
                where: { activity_id: Number(destination_activity_id) },
                include: {
                    business: {
                        include: {
                            business_category: {
                                include: { subcategory: true }
                            }
                        }
                    }
                }
            });

            if (!dest) {
                return res.status(404).json({ error: 'Destination activity not found' });
            }

            let originZoneId: number | null = null;

            if (origin_activity_id) {
                const origin = await prisma.activity.findUnique({ where: { activity_id: Number(origin_activity_id) } });
                if (!origin) {
                    return res.status(404).json({ error: 'Origin activity not found' });
                }
                originZoneId = origin.zone_id;
            } else if (origin_lat && origin_lng) {
                const { getZoneForCoordinates } = await import('../services/zoneService.js');
                originZoneId = await getZoneForCoordinates(Number(origin_lat), Number(origin_lng));
            }

            // If missing zone_id, we can't calculate traffic.
            if (!originZoneId || !dest.zone_id) {
                return res.json({ heavyTraffic: false, trafficLevel: 'UNKNOWN', alternatives: null, reason: 'Missing zone data' });
            }

            // If same zone, usually traffic is not heavy, or at least we don't suggest alternatives
            if (originZoneId === dest.zone_id) {
                return res.json({ heavyTraffic: false, trafficLevel: 'LIGHT', alternatives: null, reason: 'Same zone' });
            }

            // 2. Determine Traffic ETA
            const snapshot = await prisma.zone_traffic_snapshot.findFirst({
                where: {
                    origin_zone_id: originZoneId,
                    destination_zone_id: dest.zone_id,
                    day_group: String(day_group)
                }
            });

            if (!snapshot) {
                return res.json({ heavyTraffic: false, trafficLevel: 'UNKNOWN', alternatives: null, reason: 'No traffic data' });
            }

            const heavyTrafficThreshold = 30; // minutes
            const lightTrafficThreshold = 15; // minutes

            const isHeavyTraffic = snapshot.avg_eta_minutes > heavyTrafficThreshold;
            let trafficLevel = 'LIGHT';
            if (isHeavyTraffic) {
                trafficLevel = 'HEAVY';
            } else if (snapshot.avg_eta_minutes > lightTrafficThreshold) {
                trafficLevel = 'MODERATE';
            }

            if (!isHeavyTraffic) {
                return res.json({
                    heavyTraffic: false,
                    trafficLevel,
                    eta: snapshot.avg_eta_minutes,
                    alternatives: null
                });
            }

            // 3. Find Main Category of destination
            const categories = dest.business?.business_category;
            let mainCategory = null;

            if (categories && categories.length > 0) {
                // Just use the first category's main_category
                mainCategory = categories[0].subcategory?.main_category || null;
            }

            // 4. Fetch Alternatives (will use fallback if mainCategory is null or no matches found)
            const alternatives = await getAlternativeBusinesses(originZoneId, mainCategory, 3);


            return res.json({
                heavyTraffic: true,
                trafficLevel,
                eta: snapshot.avg_eta_minutes,
                alternatives,
                suggestionZone: originZoneId,
                mainCategoryMatches: mainCategory
            });

        } catch (error) {
            mapLogger.error({ error: String(error) }, 'Failed to get alternative suggestions');
            return res.status(500).json({ error: 'Failed to process suggestion request' });
        }
    }
);

export default router;
