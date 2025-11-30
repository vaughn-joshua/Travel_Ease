import { Business, PriceRange } from "../../src/models/index.js";
import { sequelize, executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function price_range(req, res) {
  const { categories, pictures, id } = req.body;

  console.log("creating range...");

  try {
    await sequelize.transaction(async (t) => {
      // Create price ranges for categories
      if (categories && categories.length > 0) {
        await PriceRange.bulkCreate(
          categories.map((cat) => ({
            category_id: cat.category_id,
            min_price: cat.min_price,
            max_price: cat.max_price,
          })),
          { transaction: t }
        );
      }

      // Update business pictures
      if (pictures && id) {
        await Business.update(
          { picture: pictures },
          { 
            where: { business_id: parseInt(id) },
            transaction: t 
          }
        );
      }
    });

    res.json({ message: "successfully input price_range/s" });
  } catch (error) {
    console.error("Error creating price range:", error);
    return handleSequelizeError(error, res, 'Creating price range');
  }
}
