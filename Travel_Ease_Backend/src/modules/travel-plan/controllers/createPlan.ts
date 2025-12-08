import { Request, Response } from 'express';
import { prisma, handlePrismaError } from '../../../lib/prismaHelpers.js';
import { formatPlan } from '../utils/formatPlan.js';

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
  console.log('[create_plan] ========== CREATE PLAN REQUEST ==========');
  console.log('[create_plan] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[create_plan] Validated data:', JSON.stringify(req.validated || req.body, null, 2));
  console.log('[create_plan] User from request:', req.user);
  
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
  
  console.log('[create_plan] Extracted values:', {
    title,
    description,
    location,
    start_date,
    end_date,
    slots,
    maxSlotsParam,
    accommodation_id,
    collaboratorsCount: collaborators.length
  });
  
  // Defensive check for user ID
  const userId = req.user?.id;
  if (!userId) {
    console.error('[create_plan] ❌ ERROR: req.user.id is missing');
    console.error('[create_plan] req.user:', req.user);
    return res.status(401).json({ error: 'User ID not found in request' });
  }
  
  console.log('[create_plan] User ID:', userId);
  
  // Prefer max_slots, fallback to slots, ensure it's a number or null
  const rawMaxSlots = maxSlotsParam ?? slots ?? null;
  const maxSlots = rawMaxSlots !== null ? Number(rawMaxSlots) : null;
  console.log('[create_plan] Max slots calculation:', { rawMaxSlots, maxSlots });
  
  if (maxSlots !== null && (isNaN(maxSlots) || !Number.isInteger(maxSlots) || maxSlots < 1)) {
    console.error('[create_plan] ❌ ERROR: Invalid max_slots:', maxSlots);
    return res.status(400).json({ error: 'max_slots must be a positive integer' });
  }

  try {
    console.log('[create_plan] Starting transaction...');
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
        await tx.activity.create({
          data: {
            travel_plan_id: travelPlan.travel_plan_id,
            business_id: accommodation_id,
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

      console.log('[create_plan] Transaction completed. Travel plan ID:', travelPlan.travel_plan_id);
      return travelPlan;
    });

    console.log('[create_plan] ✅ SUCCESS - Plan created with ID:', result.travel_plan_id);
    const formattedPlan = formatPlan(result);
    console.log('[create_plan] Formatted plan:', JSON.stringify(formattedPlan, null, 2));

    res.status(201).json({ 
      message: 'Travel plan created successfully',
      ...formattedPlan
    });
  } catch (error) {
    console.error('[create_plan] ❌ ERROR - Full error:', error);
    console.error('[create_plan] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return handlePrismaError(error, res, 'Creating travel plan');
  }
}

