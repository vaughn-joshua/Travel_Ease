import { con } from "../../config/travelease_db.js";

export async function createBusinessSchema() {
  console.log("making business schema...");

  try {
    con.query(`
      -- BUSINESS MAIN TABLE
      CREATE TABLE IF NOT EXISTS business (
        business_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        house_number VARCHAR(300),
        street VARCHAR(300),
        brgy VARCHAR(300),
        city VARCHAR(300),
        latitude DOUBLE PRECISION,
        longtitude DOUBLE PRECISION,
        description TEXT,
        rating DECIMAL(3,1),
        google_authenticator VARCHAR(100),
        status BOOLEAN DEFAULT FALSE,
        picture TEXT
      );

      -- CORE DEPENDENCY TABLES
      CREATE TABLE IF NOT EXISTS business_category(
        category_id SERIAL PRIMARY KEY,
        business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
        category_name category NOT NULL
      );

      -- FAVORITES
      CREATE TABLE IF NOT EXISTS business_favorite(
        favorite_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        business_id INT REFERENCES business(business_id) ON DELETE CASCADE
      );

      -- BUSINESS RELATED TABLES
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business(business_id) ON DELETE CASCADE,
        day_of_week VARCHAR(10),
        open_time TIME,
        close_time TIME
      );

      CREATE TABLE IF NOT EXISTS price_range(
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES business_category(category_id) ON DELETE SET NULL,
        min_price INT NOT NULL,
        max_price INT NOT NULL
      );


    `);
    console.log("Business tables created.");
  } catch (error) {
    console.error("Error creating business tables", error);
  }
}
