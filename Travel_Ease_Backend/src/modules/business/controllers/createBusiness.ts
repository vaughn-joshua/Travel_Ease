import { prisma, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

/**
 * Create a new business.
 * 
 * Business State Machine:
 *   - status: false (default) = Draft/Inactive - not visible in public listings
 *   - status: true = Active - visible in public listings (travel_spots)
 * 
 * Price State Machine:
 *   - both null: price not set
 *   - only min_price set: minimum price known
 *   - only max_price set: maximum price known
 *   - both set: min_price <= max_price (enforced by validation)
 * 
 * Ownership: Business is always associated with the authenticated user (user_id)
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

  // Use authenticated user ID from middleware
  const userId = req.user!.id;

  try {
    // Create business with related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create business with price fields directly on the business table
      const business = await tx.business.create({
        data: {
          user_id: userId,
          name,
          house_number: house_no,
          street,
          brgy,
          city,
          latitude: lat,
          longitude: lng,
          description,
          picture: secure_url,
          // Price range stored directly on business (not in separate table)
          min_price: min_price ?? null,
          max_price: max_price ?? null,
          // New businesses start as inactive (Draft state)
          status: false,
        }
      });

      // Create business hours
      if (business_hrs && business_hrs.length > 0) {
        await tx.businessHours.createMany({
          data: business_hrs.map((hrs: { day: string; start?: string; end?: string }) => ({
            business_id: business.business_id,
            day_of_week: hrs.day,
            open_time: hrs.start ? new Date(`1970-01-01T${hrs.start}`) : null,
            close_time: hrs.end ? new Date(`1970-01-01T${hrs.end}`) : null,
          }))
        });
      }

      // Create business categories
      if (category && category.length > 0) {
        await tx.businessCategory.createMany({
          data: category.map((cat: string) => ({
            business_id: business.business_id,
            category_name: cat,
          }))
        });
      }

      return business;
    });

    res.status(201).json({ 
      message: "successfully created a business",
      business_id: result.business_id
    });
  } catch (error) {
    console.error("Error creating business:", error);
    return handlePrismaError(error, res, 'Creating business');
  }
}

