import { createCoreSchema } from "./schemas/core_type.js";
import { createBusinessSchema } from "./schemas/business_model.js";
import { review_model } from "./schemas/review_model.js";
import { createTravelSchema } from "./schemas/travel_model.js";
import { user_model } from "./schemas/user_model.js";

export async function initAllSchemas(req, res) {
  try {
    console.log("Starting DB initialization...");

    // 1. Core types and category table
    await createCoreSchema();

    // 2. User table and blog/favorites
    await user_model();

    // 3. Business tables
    await createBusinessSchema();

    // 4. Travel plan, activities, participants
    await createTravelSchema();

    // 5. Reviews (depends on user/business/travel_plan)
    await review_model();

    console.log("All schemas initialized successfully!");
    return res
      .status(200)
      .json({ message: "All schemas initialized successfully" });
  } catch (err) {
    console.error("Error initializing DB schemas:", err);
  }
}
