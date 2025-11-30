import { Op } from "sequelize";
import { Business, BusinessCategory, BusinessHours, PriceRange } from "../../src/models/index.js";
import { sequelize, executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function edit_business(req, res) {
  const { id } = req.params;
  const updateData = req.body;
  const businessId = parseInt(id);

  try {
    const result = await sequelize.transaction(async (t) => {
      // Find the business first
      const business = await Business.findByPk(businessId, { transaction: t });
      
      if (!business) {
        throw { notFound: true };
      }

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
      await business.update(businessUpdateData, { transaction: t });

      // Handle category updates if provided
      if (updateData.category && Array.isArray(updateData.category)) {
        // Get existing categories
        const existingCategories = await BusinessCategory.findAll({
          where: { business_id: businessId },
          attributes: ['category_id'],
          transaction: t
        });

        if (existingCategories.length > 0) {
          const categoryIds = existingCategories.map(c => c.category_id);
          // Delete price ranges first (foreign key constraint)
          await PriceRange.destroy({
            where: { category_id: { [Op.in]: categoryIds } },
            transaction: t
          });
          // Delete categories
          await BusinessCategory.destroy({
            where: { business_id: businessId },
            transaction: t
          });
        }

        // Create new categories
        if (updateData.category.length > 0) {
          const newCategories = await BusinessCategory.bulkCreate(
            updateData.category.map((cat) => ({
              business_id: businessId,
              category_name: cat,
            })),
            { transaction: t, returning: true }
          );

          // Create price ranges for new categories if price data provided
          const minPrice = updateData.min_price;
          const maxPrice = updateData.max_price;

          if (minPrice !== undefined || maxPrice !== undefined) {
            await PriceRange.bulkCreate(
              newCategories.map((cat) => ({
                category_id: cat.category_id,
                min_price: minPrice || 0,
                max_price: maxPrice || 0,
              })),
              { transaction: t }
            );
          }
        }
      } else if (updateData.min_price !== undefined || updateData.max_price !== undefined) {
        // Update price ranges for existing categories
        const existingCategories = await BusinessCategory.findAll({
          where: { business_id: businessId },
          attributes: ['category_id'],
          transaction: t
        });

        if (existingCategories.length > 0) {
          const categoryIds = existingCategories.map(c => c.category_id);
          // Delete existing price ranges
          await PriceRange.destroy({
            where: { category_id: { [Op.in]: categoryIds } },
            transaction: t
          });

          // Create new price ranges
          await PriceRange.bulkCreate(
            existingCategories.map((cat) => ({
              category_id: cat.category_id,
              min_price: updateData.min_price || 0,
              max_price: updateData.max_price || 0,
            })),
            { transaction: t }
          );
        }
      }

      // Handle business hours updates if provided
      if (updateData.business_hrs && Array.isArray(updateData.business_hrs)) {
        // Delete existing hours
        await BusinessHours.destroy({
          where: { business_id: businessId },
          transaction: t
        });

        // Create new hours
        if (updateData.business_hrs.length > 0) {
          await BusinessHours.bulkCreate(
            updateData.business_hrs.map((hrs) => ({
              business_id: businessId,
              day_of_week: hrs.day,
              open_time: hrs.start ? new Date(`1970-01-01T${hrs.start}`) : null,
              close_time: hrs.end ? new Date(`1970-01-01T${hrs.end}`) : null,
            })),
            { transaction: t }
          );
        }
      }

      // Fetch updated business with relations
      return await Business.findByPk(businessId, {
        include: [
          {
            model: BusinessCategory,
            as: 'categories',
            include: [{
              model: PriceRange,
              as: 'priceRanges'
            }]
          },
          {
            model: BusinessHours,
            as: 'businessHours'
          }
        ],
        transaction: t
      });
    });

    res.json({
      message: "Business updated successfully",
      business: result,
      business_id: businessId,
    });
  } catch (error) {
    if (error.notFound) {
      return res.status(404).json({ error: "Business not found" });
    }
    console.error("Error updating business:", error);
    return handleSequelizeError(error, res, 'Updating business');
  }
}
