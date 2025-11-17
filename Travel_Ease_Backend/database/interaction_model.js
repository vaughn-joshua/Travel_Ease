import { con } from "../travelease_db.js";

export async function createInteractionSchema() {
  try {
    con.query(`
      -- BLOG CONTENT
      CREATE TABLE IF NOT EXISTS blog (
        blog_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        content TEXT,
        category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
        blog_date DATE DEFAULT CURRENT_DATE
      );

      -- FAVORITES
      CREATE TABLE IF NOT EXISTS business_favorite(
        favorite_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        business_id INT REFERENCES business(business_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS travel_plan_favorite(
        favorite_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE
      );

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