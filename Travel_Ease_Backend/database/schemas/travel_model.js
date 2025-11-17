import { con } from "../../config/travelease_db.js";

export async function createTravelSchema() {
  try {
    con.query(`
      -- TRAVEL PLAN MAIN TABLE
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
        location TEXT
      );

      -- ACTIVITY AND BUDGET
      CREATE TABLE IF NOT EXISTS activity(
        activity_id SERIAL PRIMARY KEY, 
        travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
        business_id INT REFERENCES business(business_id) ON DELETE SET NULL,
        notes TEXT,
        target_date DATE,
        budget_range range,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        is_priority BOOLEAN DEFAULT FALSE
      );

      -- PARTICIPANTS AND ROLES
      CREATE TABLE IF NOT EXISTS participant (
        participant_id SERIAL PRIMARY KEY,
        travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        role participant_role NOT NULL DEFAULT 'Viewer',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS travel_plan_favorite(
        favorite_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
        travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE
      );
    `);
    console.log("Travel and planning tables created.");
  } catch (error) {
    console.error("Error creating travel tables", error);
  }
}
