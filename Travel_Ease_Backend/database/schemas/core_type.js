import { con } from "../../config/travelease_db.js";

export async function createCoreSchema() {
  console.log("making core schema...");
  try {
    con.query(`
      -- DEFINE CUSTOM TYPES FIRST
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
          CREATE TYPE status_enum AS ENUM ('Draft', 'Active', 'Completed', 'Cancelled');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_role') THEN
          CREATE TYPE participant_role AS ENUM ('Admin', 'Editor', 'Viewer');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'range') THEN
          CREATE TYPE range AS ENUM ('0-100', '100-200', '200-400', '400-700', '700-1000', '1000-1500', '1500+');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category') THEN
          CREATE TYPE category AS ENUM 
            ('food', 'drinks', 'accomodation', 'souvenir shop', 'nature', 'night life', 'leisure', 'activities', 'local offers');
        END IF;
      END $$;
    `);

    console.log("Core tables and types created.");
  } catch (error) {
    console.error("Error creating core tables", error);
  }
}
