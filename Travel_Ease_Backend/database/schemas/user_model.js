import { con } from "../../config/travelease_db.js";

export async function user_model() {
  try {
    con.query(`
      -- USER
      CREATE TABLE IF NOT EXISTS "user" (
        user_id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        contact_no VARCHAR(20),
        password VARCHAR NOT NULL
      );

      -- BLOG CONTENT
      CREATE TABLE IF NOT EXISTS blog (
        blog_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        content TEXT,
        blog_date DATE DEFAULT CURRENT_DATE
      );
    `);
    console.log("Interaction and review tables created.");
  } catch (error) {
    console.error("Error creating interaction tables", error);
  }
}
