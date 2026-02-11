import { prisma, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";
import { businessLogger } from "../../../lib/logger.js";

// LGU Admin user ID - owner of preloaded Tagaytay businesses
const LGU_ADMIN_ID = parseInt(process.env.LGU_ADMIN_ID || '7210');

/**
 * Find matching business by name and city (with optional street)
 * Uses case-insensitive name matching as per requirements
 */
async function findMatchingBusiness(
  name: string,
  city: string,
  street?: string | null,
  tx?: any
) {
  const dbClient = tx || prisma;
  
  // Build where clause - name and city are required for deduplication
  const whereClause: any = {
    name: {
      equals: name,
      mode: 'insensitive'
    },
    city: city
  };
  
  // If street is provided, use it for more precise matching
  if (street) {
    whereClause.street = street;
  }
  
  businessLogger.debug(
    { name, city, street },
    'Searching for matching business'
  );
  
  return dbClient.business.findFirst({
    where: whereClause,
    select: {
      business_id: true,
      name: true,
      user_id: true,
      claimed_by_user_id: true,
      status: true
    }
  });
}

/**
 * Create a new business and return it with related records
 */
async function createNewBusiness(
  data: any,
  tx: any
) {
  const {
    name,
    house_no,
    street,
    brgy,
    city,
    description,
    lat,
    lng,
    secure_url,
    business_hrs,
    category,
    min_price,
    max_price,
    userId
  } = data;

  // Create business with related records in a transaction
  const business = await tx.business.create({
    data: {
      user_id: userId,
      name,
      house_number: house_no,
      street,
      brgy,
      city,
      latitude: lat,
      longtitude: lng, // Note: DB column has typo
      description,
      picture: secure_url
        ? typeof secure_url === "string"
          ? secure_url
          : JSON.stringify(secure_url)
        : null,
      min_price: min_price ?? null,
      max_price: max_price ?? null,
      // New user registrations start as PENDING awaiting admin approval
      status: 'PENDING'
    }
  });

  // Create business hours
  if (business_hrs && business_hrs.length > 0) {
    await tx.business_hours.createMany({
      data: business_hrs.map((hrs: { day: string; start?: string; end?: string }) => ({
        business_id: business.business_id,
        day_of_week: hrs.day,
        open_time: hrs.start ? new Date(`1970-01-01T${hrs.start}`) : null,
        close_time: hrs.end ? new Date(`1970-01-01T${hrs.end}`) : null,
      }))
    });
  }

  // TODO: Implement proper category to subcategory_id mapping
  // For now, skip category creation if no subcategory mapping available

  businessLogger.info(
    { business_id: business.business_id, name, city, user_id: userId, status: business.status },
    'New business created'
  );

  return business;
}

/**
 * Claim an LGU-owned business
 */
async function claimLguBusiness(
  businessId: number,
  userId: number,
  tx: any
) {
  return tx.business.update({
    where: { business_id: businessId },
    data: {
      claimed_by_user_id: userId,
      claimed_at: new Date()
    }
  });
}

/**
 * Create or claim a business based on deduplication logic
 * 
 * Step 2: Backend Pre-Insert Check
 * - Query matching business by name + city (+street if provided)
 * 
 * Step 3: Decision Tree
 * - No match: Create new business with status=PENDING
 * - Match found, LGU-owned: Allow claim (convert to claim, keep status)
 * - Match found, user-owned: Error - already registered
 * - Match found, other user owned: Error - already claimed
 */
export async function create_business(req: Request, res: Response) {
  const {
    name,
    house_no,
    street,
    brgy,
    city,
    description,
    lat,
    lng,
    secure_url,
    business_hrs,
    category,
    min_price,
    max_price,
  } = req.body;

  const userId = req.user!.id;

  try {
    // Step 2: Check for matching business
    const matchingBusiness = await findMatchingBusiness(name, city, street);

    businessLogger.debug(
      { userId, name, city, matchingBusiness: matchingBusiness ? { business_id: matchingBusiness.business_id, user_id: matchingBusiness.user_id } : null },
      'Deduplication check result'
    );

    // Step 3: Decision tree
    if (!matchingBusiness) {
      // Case A: No existing match - Create new business
      const result = await prisma.$transaction(async (tx) => {
        return createNewBusiness({
          name,
          house_no,
          street,
          brgy,
          city,
          description,
          lat,
          lng,
          secure_url,
          business_hrs,
          category,
          min_price,
          max_price,
          userId
        }, tx);
      });

      return res.status(201).json({
        message: "Business registered successfully. Awaiting admin approval.",
        business_id: result.business_id,
        status: result.status,
        isClaim: false
      });
    }

    // Case B: Match found, owned by LGU
    if (matchingBusiness.user_id === LGU_ADMIN_ID) {
      // Allow user to claim this LGU business
      const claimed = await prisma.$transaction(async (tx) => {
        return claimLguBusiness(matchingBusiness.business_id, userId, tx);
      });

      businessLogger.info(
        { business_id: matchingBusiness.business_id, user_id: userId, name },
        'Business claimed by user'
      );

      return res.status(201).json({
        message: "Business claimed successfully. Awaiting admin approval.",
        business_id: claimed.business_id,
        status: claimed.status,
        isClaim: true
      });
    }

    // Case C: Match found, owned by current user
    if (matchingBusiness.user_id === userId) {
      businessLogger.warn(
        { business_id: matchingBusiness.business_id, user_id: userId, name },
        'User attempted to register duplicate business they already own'
      );

      return res.status(409).json({
        error: "You already registered this business",
        code: "DUPLICATE_USER_BUSINESS"
      });
    }

    // Case D: Match found, already claimed by another user
    if (matchingBusiness.claimed_by_user_id !== null) {
      businessLogger.warn(
        { business_id: matchingBusiness.business_id, claimed_by: matchingBusiness.claimed_by_user_id, user_id: userId, name },
        'User attempted to claim business already claimed by another user'
      );

      return res.status(409).json({
        error: "This business has already been claimed by another user",
        code: "BUSINESS_ALREADY_CLAIMED"
      });
    }

    // Default: unhandled case (shouldn't reach here)
    businessLogger.error(
      { business_id: matchingBusiness.business_id, matchingBusiness, userId, name },
      'Unhandled case in business registration logic'
    );

    return res.status(500).json({
      error: "An error occurred while processing your registration",
      code: "REGISTRATION_ERROR"
    });

  } catch (error) {
    businessLogger.error(
      { error: error instanceof Error ? error.message : String(error), userId, name: req.body.name },
      'Error in create_business'
    );
    return handlePrismaError(error, res, 'Creating business');
  }
}


