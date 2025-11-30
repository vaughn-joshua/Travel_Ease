import { BusinessCategory, PriceRange } from "../../src/models/index.js";
import { executeWithRetry } from "../../src/lib/sequelize.js";
import { handleSequelizeError } from "../../src/lib/queryHelpers.js";

export async function categories_fetch(req, res) {
  const { id } = req.params;

  try {
    const categories = await executeWithRetry(() =>
      BusinessCategory.findAll({
        where: { business_id: parseInt(id) },
        include: [{
          model: PriceRange,
          as: 'priceRanges'
        }]
      })
    );

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return handleSequelizeError(error, res, 'Fetching categories');
  }
}
