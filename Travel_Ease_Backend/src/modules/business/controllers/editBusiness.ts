import { prisma, handlePrismaError } from "../../../lib/prismaHelpers.js";
import { Request, Response } from "express";

interface NotFoundError {
  notFound: boolean;
}

/**
 * Edit a business.
 * 
 * Business State Machine:
 *   - status: false = Draft/Inactive - not visible in public listings
 *   - status: true = Active - visible in public listings (travel_spots)
 *   - Transitions: Draft → Active (status = true), Active → Draft (status = false)
 *   - No terminal states for business (unlike TravelPlan)
 * 
 * Price State Machine:
 *   - both null: price not set
 *   - only min_price set: minimum price known
 *   - only max_price set: maximum price known
 *   - both set: min_price <= max_price (enforced by validation)
 * 
 * Ownership: Only the business owner (user_id) can edit
 *            Enforced by requireBusinessOwnership middleware
 */
export async function edit_business(req: Request, res: Response) {
  const { id } = req.params;
  const updateData = req.body;
  const businessId = parseInt(id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the business first
      const business = await tx.business.findUnique({
        where: { business_id: businessId }
      });
      
      if (!business) {
        throw { notFound: true } as NotFoundError;
      }

      // Build the business update data, mapping aliased field names
      const businessUpdateData: Record<string, any> = {};

      // Basic fields
      if (updateData.name !== undefined) {
        businessUpdateData.name = updateData.name;
      }
      if (updateData.description !== undefined) {
        businessUpdateData.description = updateData.description;
      }

      // Location fields - accept both naming conventions
      const houseNumber = updateData.house_no ?? updateData.house_number;
      if (houseNumber !== undefined) {
        businessUpdateData.house_number = houseNumber;
      }
      if (updateData.street !== undefined) {
        businessUpdateData.street = updateData.street;
      }
      if (updateData.brgy !== undefined) {
        businessUpdateData.brgy = updateData.brgy;
      }
      if (updateData.city !== undefined) {
        businessUpdateData.city = updateData.city;
      }

      // Coordinates - accept both naming conventions
      const latitude = updateData.lat ?? updateData.latitude;
      const longitude = updateData.lng ?? updateData.longitude ?? updateData.longtitude;
      if (latitude !== undefined) {
        businessUpdateData.latitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      }
      if (longitude !== undefined) {
        businessUpdateData.longitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      }

      // Picture - accept both naming conventions, store as-is
      const picture = updateData.secure_url ?? updateData.picture;
      if (picture !== undefined) {
        businessUpdateData.picture = picture;
      }

      // Other fields
      if (updateData.rating !== undefined) {
        businessUpdateData.rating = updateData.rating;
      }
      if (updateData.status !== undefined) {
        businessUpdateData.status = updateData.status;
      }

      // Price range - write directly to business table
      if (updateData.min_price !== undefined) {
        businessUpdateData.min_price = updateData.min_price;
      }
      if (updateData.max_price !== undefined) {
        businessUpdateData.max_price = updateData.max_price;
      }

      // Update the main business record
      await tx.business.update({
        where: { business_id: businessId },
        data: businessUpdateData
      });

      // Handle category updates if provided
      // Note: business_category uses subcategory_id, not category_name
      if (updateData.category && Array.isArray(updateData.category)) {
        // Delete existing categories (cascade will handle related data)
        await tx.business_category.deleteMany({
          where: { business_id: businessId }
        });

        // Create new categories - categories should be subcategory_ids
        if (updateData.category.length > 0) {
          for (const subcategoryId of updateData.category) {
            const subId = typeof subcategoryId === 'number' ? subcategoryId : parseInt(subcategoryId);
            if (!isNaN(subId)) {
              await tx.business_category.create({
                data: {
                  business_id: businessId,
                  subcategory_id: subId,
                }
              });
            }
          }
        }
      }

      // Handle business hours updates if provided
      if (updateData.business_hrs && Array.isArray(updateData.business_hrs)) {
        // Delete existing hours
        await tx.business_hours.deleteMany({
          where: { business_id: businessId }
        });

        // Create new hours
        if (updateData.business_hrs.length > 0) {
          await tx.business_hours.createMany({
            data: updateData.business_hrs.map((hrs: { day: string; start?: string; end?: string }) => ({
              business_id: businessId,
              day_of_week: hrs.day,
              open_time: hrs.start ? new Date(`1970-01-01T${hrs.start}`) : null,
              close_time: hrs.end ? new Date(`1970-01-01T${hrs.end}`) : null,
            }))
          });
        }
      }

      // Fetch updated business with relations
      return await tx.business.findUnique({
        where: { business_id: businessId },
        include: {
          business_category: {
            select: {
              category_id: true,
            }
          },
          business_hours: true
        }
      });
    });

    res.json({
      message: "Business updated successfully",
      business: result,
      business_id: businessId,
    });
  } catch (error: any) {
    if (error.notFound) {
      return res.status(404).json({ error: "Business not found" });
    }
    console.error("Error updating business:", error);
    return handlePrismaError(error, res, 'Updating business');
  }
}
