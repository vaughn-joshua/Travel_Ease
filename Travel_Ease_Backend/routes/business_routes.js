import { Router } from "express";
import { Op } from "sequelize";
import { authenticateToken } from "../src/middleware/auth.js";
import { requireBusinessOwnership } from "../src/middleware/ownership.js";
import { 
  validate, 
  createBusinessSchema, 
  editBusinessSchema,
  priceRangeSchema
} from "../src/schemas/validation.js";
import {
  create_business,
  price_range,
  business_fetch,
  categories_fetch,
  edit_business,
  get_businesses,
  getCategories,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../business/index.js";
import { Business, BusinessReview, BusinessCategory, BusinessHours, BusinessFavorite, PriceRange, MenuItem, User } from "../src/models/index.js";
import { sequelize, executeWithRetry } from "../src/lib/sequelize.js";
import { handleSequelizeError } from "../src/lib/queryHelpers.js";

const router = Router();

// Create routes (auth + validation)
router.post("/create_business", authenticateToken, validate(createBusinessSchema), create_business);
router.post("/price_range", authenticateToken, validate(priceRangeSchema), price_range);

// Public read routes
router.get("/fetch_business/:id", business_fetch);
router.get("/fetch_categories/:id", categories_fetch);
router.get("/businesses", get_businesses);
router.get("/categories", getCategories);

// Edit routes (auth + ownership + validation)
router.put("/edit_business/:id", authenticateToken, requireBusinessOwnership, validate(editBusinessSchema), edit_business);

// Get current user's businesses
router.get("/my-businesses", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const businesses = await executeWithRetry(() =>
      Business.findAll({
        where: { user_id: userId },
        include: [
          {
            model: BusinessCategory,
            as: 'categories'
          },
          {
            model: BusinessHours,
            as: 'businessHours'
          }
        ],
        order: [['business_id', 'DESC']]
      })
    );
    
    res.json({
      message: "Success",
      data: businesses,
      count: businesses.length
    });
  } catch (error) {
    console.error("Error fetching user's businesses:", error);
    return handleSequelizeError(error, res, 'Fetching user businesses');
  }
});

// Delete business (auth + ownership required)
router.delete("/delete_business/:id", authenticateToken, requireBusinessOwnership, async (req, res) => {
  const businessId = parseInt(req.params.id);
  
  try {
    await sequelize.transaction(async (t) => {
      // Get category IDs for this business
      const categories = await BusinessCategory.findAll({
        where: { business_id: businessId },
        attributes: ['category_id'],
        transaction: t
      });
      
      const categoryIds = categories.map(c => c.category_id);
      
      // Delete price ranges
      if (categoryIds.length > 0) {
        await PriceRange.destroy({
          where: { category_id: { [Op.in]: categoryIds } },
          transaction: t
        });
      }
      
      // Delete related records
      await Promise.all([
        BusinessCategory.destroy({ where: { business_id: businessId }, transaction: t }),
        BusinessHours.destroy({ where: { business_id: businessId }, transaction: t }),
        BusinessReview.destroy({ where: { business_id: businessId }, transaction: t }),
        BusinessFavorite.destroy({ where: { business_id: businessId }, transaction: t }),
        MenuItem.destroy({ where: { business_id: businessId }, transaction: t })
      ]);
      
      // Delete the business
      await Business.destroy({
        where: { business_id: businessId },
        transaction: t
      });
    });
    
    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    console.error("Error deleting business:", error);
    return handleSequelizeError(error, res, 'Deleting business');
  }
});

// Menu item routes
router.get("/:id/menu", getMenuItems);
router.post("/:id/menu", authenticateToken, createMenuItem);
router.put("/:id/menu/:itemId", authenticateToken, updateMenuItem);
router.delete("/:id/menu/:itemId", authenticateToken, deleteMenuItem);

// Travel spots endpoints (public for browsing)
router.get("/travel_spots", async (req, res) => {
  try {
    const businesses = await executeWithRetry(() =>
      Business.findAll({
        where: { status: true }, // Only show approved/active businesses
        attributes: [
          'business_id',
          'user_id',
          'name',
          'house_number',
          'street',
          'brgy',
          'city',
          'latitude',
          'longtitude',
          'description',
          'rating',
          'status',
          'picture'
        ],
        order: [['rating', 'DESC NULLS LAST']]
      })
    );
    
    res.json({
      message: "Success",
      data: businesses,
    });
  } catch (error) {
    console.error("Error fetching travel spots:", error);
    return handleSequelizeError(error, res, 'Fetching travel spots');
  }
});

router.get("/travel_spots/reviews/:id", async (req, res) => {
  const businessId = parseInt(req.params.id);
  
  try {
    const reviews = await executeWithRetry(() =>
      BusinessReview.findAll({
        where: { business_id: businessId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name']
        }],
        order: [['review_date', 'DESC']]
      })
    );
    
    res.json({
      message: "Success",
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return handleSequelizeError(error, res, 'Fetching reviews');
  }
}); 

export default router;
