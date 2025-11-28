import { prisma } from "../../src/lib/prisma.js";

export async function edit_business(req, res) {
  const { id } = req.params;
  const updateData = req.body;
  const businessId = parseInt(id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Build the business update data, mapping aliased field names
      const businessUpdateData = {};

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
      const longitude = updateData.lng ?? updateData.longtitude;
      if (latitude !== undefined) {
        businessUpdateData.latitude = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
      }
      if (longitude !== undefined) {
        businessUpdateData.longtitude = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
      }

      // Picture - accept both naming conventions
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

      // Update the main business record
      const business = await tx.business.update({
        where: { business_id: businessId },
        data: businessUpdateData,
      });

      // Handle category updates if provided
      if (updateData.category && Array.isArray(updateData.category)) {
        // Delete existing categories and their price ranges
        const existingCategories = await tx.businessCategory.findMany({
          where: { business_id: businessId },
          select: { category_id: true },
        });

        if (existingCategories.length > 0) {
          // Delete price ranges first (foreign key constraint)
          await tx.priceRange.deleteMany({
            where: {
              category_id: { in: existingCategories.map((c) => c.category_id) },
            },
          });
          // Delete categories
          await tx.businessCategory.deleteMany({
            where: { business_id: businessId },
          });
        }

        // Create new categories
        if (updateData.category.length > 0) {
          await tx.businessCategory.createMany({
            data: updateData.category.map((cat) => ({
              business_id: businessId,
              category_name: cat,
            })),
          });

          // Create price ranges for new categories if price data provided
          const minPrice = updateData.min_price;
          const maxPrice = updateData.max_price;

          if (minPrice !== undefined || maxPrice !== undefined) {
            const newCategories = await tx.businessCategory.findMany({
              where: { business_id: businessId },
              select: { category_id: true },
            });

            if (newCategories.length > 0) {
              await tx.priceRange.createMany({
                data: newCategories.map((cat) => ({
                  category_id: cat.category_id,
                  min_price: minPrice || 0,
                  max_price: maxPrice || 0,
                })),
              });
            }
          }
        }
      } else if (updateData.min_price !== undefined || updateData.max_price !== undefined) {
        // Update price ranges for existing categories
        const existingCategories = await tx.businessCategory.findMany({
          where: { business_id: businessId },
          select: { category_id: true },
        });

        if (existingCategories.length > 0) {
          // Delete existing price ranges
          await tx.priceRange.deleteMany({
            where: {
              category_id: { in: existingCategories.map((c) => c.category_id) },
            },
          });

          // Create new price ranges
          await tx.priceRange.createMany({
            data: existingCategories.map((cat) => ({
              category_id: cat.category_id,
              min_price: updateData.min_price || 0,
              max_price: updateData.max_price || 0,
            })),
          });
        }
      }

      // Handle business hours updates if provided
      if (updateData.business_hrs && Array.isArray(updateData.business_hrs)) {
        // Delete existing hours
        await tx.businessHours.deleteMany({
          where: { business_id: businessId },
        });

        // Create new hours
        if (updateData.business_hrs.length > 0) {
          await tx.businessHours.createMany({
            data: updateData.business_hrs.map((hrs) => ({
              business_id: businessId,
              day_of_week: hrs.day,
              open_time: hrs.start ? new Date(`1970-01-01T${hrs.start}`) : null,
              close_time: hrs.end ? new Date(`1970-01-01T${hrs.end}`) : null,
            })),
          });
        }
      }

      // Fetch updated business with relations
      return await tx.business.findUnique({
        where: { business_id: businessId },
        include: {
          categories: {
            include: {
              price_ranges: true,
            },
          },
          business_hours: true,
        },
      });
    });

    res.json({
      message: "Business updated successfully",
      business: result,
      business_id: businessId,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Business not found" });
    }
    res.status(500).json({ error: error.message });
  }
}
