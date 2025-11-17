import { con } from "../travelease_db.js";

export async function createCoreSchema() {
  try {
    con.query(`
      -- DEFINE CUSTOM TYPES FIRST
      CREATE TYPE status_enum AS ENUM ('Draft', 'Active', 'Completed', 'Cancelled');
      CREATE TYPE participant_role AS ENUM ('Admin', 'Editor', 'Viewer');
      CREATE TYPE range AS ENUM ('0-100', '100-200', '200-400', '400-700', '700-1000', '1000-1500', '1500+');

      -- CORE DEPENDENCY TABLES
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
    `);
    console.log("Core tables and types created.");
  } catch (error) {
    console.error("Error creating core tables", error);
  }
}