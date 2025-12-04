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
    collaborators = [],
  } = validated;
  
  // Defensive check for user ID
  const userId = req.user?.id;
  if (!userId) {
    console.error('create_plan: req.user.id is missing');
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
      const travelPlan = await tx.travelPlan.create({
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

    res.status(201).json({ 
      message: 'Travel plan created successfully',
      ...formatPlan(result)
    });
  } catch (error) {
    console.error('Error creating travel plan:', error);
    return handlePrismaError(error, res, 'Creating travel plan');
  }
}

