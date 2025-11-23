import { con } from "../travelease_db.js";

export async function model_db(req, res) {
  try {
    con.query(`
            CREATE TABLE IF NOT EXISTS category(
            category_id SERIAL PRIMARY KEY,
            category_name VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "user" (
            user_id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            contact_no VARCHAR(20),
            password VARCHAR NOT NULL
            );

            CREATE TABLE IF NOT EXISTS blog (
            blog_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            content TEXT,
            category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
            blog_date DATE DEFAULT CURRENT_DATE
            );

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

            CREATE TABLE IF NOT EXISTS business_hours (
            id SERIAL PRIMARY KEY,
            business_id INTEGER REFERENCES business(business_id) ON DELETE CASCADE,
            day_of_week VARCHAR(10),
            open_time TIME,
            close_time TIME
            );

            CREATE TYPE status_enum AS ENUM ('Draft', 'Active', 'Completed', 'Cancelled');

            CREATE TABLE IF NOT EXISTS travel_plan(
            travel_plan_id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            start_date DATE,
            end_date DATE,
            description TEXT,
            visibility BOOLEAN DEFAULT FALSE,
            visibility_end_date DATE,
            status status_enum NOT NULL DEFAULT 'Draft',
            max_slots INT,
            location TEXT,
            visibility_timestamp TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS business_favorite(
            favorite_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            business_id INT REFERENCES business(business_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS business_review(
            review_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
            rating DECIMAL(3,1),
            content TEXT,
            review_date DATE DEFAULT CURRENT_DATE
            );

            CREATE TABLE IF NOT EXISTS travel_plan_favorite(
            favorite_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS travel_plan_review(
            review_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
            rating DECIMAL(3,1),
            content TEXT,
            review_date DATE DEFAULT CURRENT_DATE
            );

            CREATE TYPE range AS ENUM ('0-100', '100-200', '200-400', '400-700', '700-1000', '1000-1500', '1500+');

            CREATE TABLE IF NOT EXISTS product_service(
            product_service_id SERIAL PRIMARY KEY,
            business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            price_range range NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activity(
            activity_id SERIAL PRIMARY KEY, 
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
            business_id INT REFERENCES business(business_id) ON DELETE SET NULL,
            title VARCHAR(200) NOT NULL, 
            notes TEXT,
            target_date DATE,
            budget_range range,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            is_priority BOOLEAN DEFAULT FALSE
            );

            CREATE TYPE participant_role AS ENUM ('Admin', 'Editor', 'Viewer');

            CREATE TABLE IF NOT EXISTS participant (
            participant_id SERIAL PRIMARY KEY,
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            role participant_role NOT NULL DEFAULT 'Viewer',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status BOOLEAN DEFAULT FALSE
            );
            

            `);
    console.log("Tables are created or already exist.");
    res
      .status(200)
      .json({ message: "good job, created database successfully" });
  } catch (error) {
    console.error("Error creating tables", error);
  }
}
