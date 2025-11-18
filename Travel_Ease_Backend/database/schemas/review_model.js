import { con } from "../../config/travelease_db.js";

export async function review_model() {
  try {
    con.query(`
      -- REVIEWS
      CREATE TABLE IF NOT EXISTS business_review(
        review_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
        rating DECIMAL(3,1),
        content TEXT,
        review_date DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE IF NOT EXISTS travel_plan_review(
        review_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
        rating DECIMAL(3,1),
        content TEXT,
        review_date DATE DEFAULT CURRENT_DATE
      );
    `);
    console.log("Interaction and review tables created.");
  } catch (error) {
    console.error("Error creating interaction tables", error);
  }
}
