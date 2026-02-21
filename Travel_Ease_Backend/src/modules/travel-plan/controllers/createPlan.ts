import { Request, Response } from 'express';
import { prisma, handlePrismaError } from '../../../lib/prismaHelpers.js';
import { formatPlan } from '../utils/formatPlan.js';
import { invalidateCachePattern } from '../../../lib/cache.js';

interface Collaborator {
  user_id: number;
  role?: string;
  status?: boolean;
}

interface ValidatedCreatePlan {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  slots?: number;
  max_slots?: number;
  accommodation_id?: number;
  collaborators?: Collaborator[];
}

export async function create_plan(req: Request, res: Response) {
  // Use validated data from Zod middleware (transforms strings to numbers)
  const validated = (req.validated || req.body) as ValidatedCreatePlan;
  const {
    title,
    description,
    location,
    start_date,
    end_date,
    slots,
    max_slots: maxSlotsParam,
    accommodation_id,
    collaborators = [],
  } = validated;

  // Defensive check for user ID
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User ID not found in request' });
  }

  // Prefer max_slots, fallback to slots, ensure it's a number or null
  const rawMaxSlots = maxSlotsParam ?? slots ?? null;
  const maxSlots = rawMaxSlots !== null ? Number(rawMaxSlots) : null;

  if (maxSlots !== null && (isNaN(maxSlots) || !Number.isInteger(maxSlots) || maxSlots < 1)) {
    return res.status(400).json({ error: 'max_slots must be a positive integer' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create travel plan
      const travelPlan = await tx.travel_plan.create({
        data: {
          name: title,
          user_id: userId,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          description,
          max_slots: maxSlots,
          location,
          status: 'Draft'
        }
      });

      // Add creator as Admin participant (always approved)
      await tx.participant.create({
        data: {
          travel_plan_id: travelPlan.travel_plan_id,
          user_id: userId,
          role: 'Admin',
          status: true
        }
      });

      // Create accommodation activity if provided
      if (accommodation_id) {
        // Fetch zone for accommodation business
        const { getZoneForBusiness } = await import('../../../services/zoneService.js');
        const zoneId = await getZoneForBusiness(accommodation_id);

        if (zoneId === null) {
          throw new Error("Accommodation business is located outside of supported traffic zones (Tagaytay City).");
        }

        await tx.activity.create({
          data: {
            travel_plan_id: travelPlan.travel_plan_id,
            business_id: accommodation_id,
            zone_id: zoneId,
            is_accommodation: true,
            target_date: null,
            user_id: userId
          }
        });
      }

      // Add collaborators with slot enforcement for approved ones
      if (collaborators?.length > 0) {
        let approvedCount = 1; // Creator counts as 1 approved

        for (const collab of collaborators) {
          // Skip if no user_id or same as creator
          if (!collab.user_id || collab.user_id === userId) continue;

          const wantsApproved = collab.status === true;

          // Skip approved collaborators if would exceed max_slots
          if (wantsApproved && maxSlots && approvedCount >= maxSlots) continue;

          await tx.participant.create({
            data: {
              travel_plan_id: travelPlan.travel_plan_id,
              user_id: collab.user_id,
              role: (collab.role || 'Viewer') as 'Admin' | 'Editor' | 'Viewer',
              status: wantsApproved
            }
          });

          if (wantsApproved) approvedCount++;
        }
      }

      return travelPlan;
    });

    // Invalidate caches for this user's plans and public plans
    await Promise.all([
      invalidateCachePattern(`travel_plans:all:${userId}`),
      invalidateCachePattern(`travel_plans:upcoming:${userId}`),
      invalidateCachePattern(`travel_plans:ongoing:${userId}`),
      invalidateCachePattern('travel_plans:public:'),
    ]);

    const formattedPlan = formatPlan(result);

    res.status(201).json({
      message: 'Travel plan created successfully',
      ...formattedPlan
    });
  } catch (error) {
    return handlePrismaError(error, res, 'Creating travel plan');
  }
}

