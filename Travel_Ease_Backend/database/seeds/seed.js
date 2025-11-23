import { faker } from "@faker-js/faker";
import { con } from "../../config/travelease_db.js";
import { createCoreSchema } from "../schemas/core_type.js";
import { user_model } from "../schemas/user_model.js";
import { createBusinessSchema } from "../schemas/business_model.js";
import { createTravelSchema } from "../schemas/travel_model.js";
import { review_model } from "../schemas/review_model.js";

async function seedDatabase() {
  console.log("🌱 Starting Database Seeding...");
    
  try {
    // 0. Reset Database (Drop all tables to ensure fresh schema)
    console.log("🔥 Resetting Database...");
    await con.query('DROP TABLE IF EXISTS business_review CASCADE');
    await con.query('DROP TABLE IF EXISTS travel_plan_review CASCADE');
    await con.query('DROP TABLE IF EXISTS travel_plan_favorite CASCADE');
    await con.query('DROP TABLE IF EXISTS participant CASCADE');
    await con.query('DROP TABLE IF EXISTS activity CASCADE');
    await con.query('DROP TABLE IF EXISTS travel_plan CASCADE');
    await con.query('DROP TABLE IF EXISTS price_range CASCADE');
    await con.query('DROP TABLE IF EXISTS business_hours CASCADE');
    await con.query('DROP TABLE IF EXISTS business_favorite CASCADE');
    await con.query('DROP TABLE IF EXISTS business_category CASCADE');
    await con.query('DROP TABLE IF EXISTS business CASCADE');
    await con.query('DROP TABLE IF EXISTS blog CASCADE');
    await con.query('DROP TABLE IF EXISTS "user" CASCADE');
    console.log("✅ Database reset.");

    // 1. Ensure Tables Exist
    console.log("📦 Setting up Schema...");
    await createCoreSchema();
    await user_model();
    await createBusinessSchema();
    await createTravelSchema();
    await review_model();
    console.log("✅ Schema setup complete.");

    // 3. Seed Users (10 Users)
    console.log("👤 Seeding Users...");
    const userIds = [];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      const password = "password123"; // Simple password for testing
      const contactNo = faker.phone.number();

      const res = await con.query(
        `INSERT INTO "user" (first_name, last_name, email, contact_no, password) 
         VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
        [firstName, lastName, email, contactNo, password]
      );
      userIds.push(res.rows[0].user_id);
    }
    console.log(`✅ Created ${userIds.length} users.`);

    // 4. Seed Businesses (20 Businesses)
    console.log("🏢 Seeding Businesses...");
    const businessIds = [];
    const categories = ['food', 'drinks', 'accomodation', 'souvenir shop', 'nature', 'night life', 'leisure', 'activities', 'local offers'];
    
    for (let i = 0; i < 20; i++) {
      const ownerId = faker.helpers.arrayElement(userIds);
      const name = faker.company.name();
      const desc = faker.company.catchPhrase();
      // Tagaytay Coordinates: Approx Lat 14.09 - 14.13, Lng 120.90 - 121.00
      const lat = faker.location.latitude({ min: 14.09, max: 14.13, precision: 6 });
      const lng = faker.location.longitude({ min: 120.90, max: 121.00, precision: 6 });
      
      const res = await con.query(
        `INSERT INTO business (user_id, name, description, latitude, longtitude, rating, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING business_id`,
        [ownerId, name, desc, lat, lng, faker.number.float({ min: 1, max: 5, precision: 0.1 }), true]
      );
      const businessId = res.rows[0].business_id;
      businessIds.push(businessId);

      // Add a category for this business
      const category = faker.helpers.arrayElement(categories);
      await con.query(
        `INSERT INTO business_category (business_id, category_name) VALUES ($1, $2)`,
        [businessId, category]
      );
    }
    console.log(`✅ Created ${businessIds.length} businesses.`);

    // 5. Seed Travel Plans
    console.log("✈️ Seeding Travel Plans...");
    const planIds = [];
    for (let i = 0; i < 15; i++) { // Create 15 plans
      const ownerId = faker.helpers.arrayElement(userIds);
      const name = faker.lorem.words(3) + " Trip";
      const startDate = faker.date.future();
      const endDate = faker.date.future({ refDate: startDate });
      
      const res = await con.query(
        `INSERT INTO travel_plan (name, user_id, start_date, end_date, description, status, location)
         VALUES ($1, $2, $3, $4, $5, 'Active', $6) RETURNING travel_plan_id`,
        [name, ownerId, startDate, endDate, faker.lorem.sentence(), faker.location.city()]
      );
      planIds.push(res.rows[0].travel_plan_id);
    }
    console.log(`✅ Created ${planIds.length} travel plans.`);

    // 6. Seed Reviews
    console.log("⭐ Seeding Reviews...");
    for (let i = 0; i < 30; i++) {
      const reviewerId = faker.helpers.arrayElement(userIds);
      const businessId = faker.helpers.arrayElement(businessIds);
      
      await con.query(
        `INSERT INTO business_review (user_id, business_id, rating, content)
         VALUES ($1, $2, $3, $4)`,
        [reviewerId, businessId, faker.number.float({ min: 1, max: 5, precision: 0.1 }), faker.lorem.sentence()]
      );
    }
    console.log("✅ Reviews created.");

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
