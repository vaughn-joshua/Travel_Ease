import { con } from "../travelease_db.js";

export async function createBusinessSchema() {
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
        business_hours VARCHAR(100),
        category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
        google_authenticator VARCHAR(100),
        status BOOLEAN DEFAULT FALSE,
        picture TEXT
      );

      -- BUSINESS RELATED TABLES
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES business(business_id) ON DELETE CASCADE,
        day_of_week VARCHAR(10),
        open_time TIME,
        close_time TIME
      );

      CREATE TABLE IF NOT EXISTS product_service(
        product_service_id SERIAL PRIMARY KEY,
        business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price_range range NOT NULL
      );
    `);
    console.log("Business tables created.");
  } catch (error) {
    console.error("Error creating business tables", error);
  }
}