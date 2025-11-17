import { createCoreSchema } from "./schemas/core_type.js";
import { createBusinessSchema } from "./schemas/business_model.js";
import { review_model } from "./schemas/review_model.js";
import { createTravelSchema } from "./schemas/travel_model.js";
import { user_model } from "./schemas/user_model.js";

export async function single_group(req, res) {
  const { table } = req.params;
  try {
    console.log(`Initializing schema group: ${table}`);

    switch (table) {
      case "business":
        await createCoreSchema();
        await user_model();
        await createBusinessSchema();
        break;
      case "user":
        await user_model();
        break;
      case "plan":
        await createTravelSchema();
        break;
      case "review":
        await review_model();
        break;
      case "config":
        await createCoreSchema();
        break;
      default:
        return res.status(400).json({ error: "Invalid table group" });
    }

    return res
      .status(200)
      .json({ message: `${table} schema initialized successfully` });
  } catch (err) {
    console.error("Error initializing DB schemas:", err);
  }
}
