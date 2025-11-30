import { faker } from "@faker-js/faker";
import { 
  sequelize, 
  User, 
  Business, 
  BusinessCategory, 
  TravelPlan, 
  BusinessReview 
} from "../../src/models/index.js";

async function seedDatabase() {
  console.log("🌱 Starting Database Seeding...");
    
  const transaction = await sequelize.transaction();
  
  try {
    // 0. Reset Database (Drop all tables to ensure fresh schema)
    console.log("🔥 Resetting Database...");
    
    // Disable foreign key checks temporarily for clean reset
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED', { transaction });
    
    await BusinessReview.destroy({ where: {}, truncate: true, cascade: true, transaction });
    await TravelPlan.destroy({ where: {}, truncate: true, cascade: true, transaction });
    await BusinessCategory.destroy({ where: {}, truncate: true, cascade: true, transaction });
    await Business.destroy({ where: {}, truncate: true, cascade: true, transaction });
    await User.destroy({ where: {}, truncate: true, cascade: true, transaction });
    
    console.log("✅ Database reset.");

    // 1. Seed Users (10 Users)
    console.log("👤 Seeding Users...");
    const userIds = [];
    for (let i = 0; i < 10; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      const password = "password123"; // Simple password for testing
      const contactNo = faker.phone.number();

      const user = await User.create({
        first_name: firstName,
        last_name: lastName,
        email,
        contact_no: contactNo,
        password,
        auth_provider: 'email',
        profile_completed: true
      }, { transaction });
      
      userIds.push(user.user_id);
    }
    console.log(`✅ Created ${userIds.length} users.`);

    // 2. Seed Businesses (20 Businesses)
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
      
      const business = await Business.create({
        user_id: ownerId,
        name,
        description: desc,
        latitude: lat,
        longtitude: lng,
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        status: true
      }, { transaction });
      
      businessIds.push(business.business_id);

      // Add a category for this business
      const category = faker.helpers.arrayElement(categories);
      await BusinessCategory.create({
        business_id: business.business_id,
        category_name: category
      }, { transaction });
    }
    console.log(`✅ Created ${businessIds.length} businesses.`);

    // 3. Seed Travel Plans
    console.log("✈️ Seeding Travel Plans...");
    const planIds = [];
    for (let i = 0; i < 15; i++) { // Create 15 plans
      const ownerId = faker.helpers.arrayElement(userIds);
      const name = faker.lorem.words(3) + " Trip";
      const startDate = faker.date.future();
      const endDate = faker.date.future({ refDate: startDate });
      
      const plan = await TravelPlan.create({
        name,
        user_id: ownerId,
        start_date: startDate,
        end_date: endDate,
        description: faker.lorem.sentence(),
        status: 'Active',
        location: faker.location.city()
      }, { transaction });
      
      planIds.push(plan.travel_plan_id);
    }
    console.log(`✅ Created ${planIds.length} travel plans.`);

    // 4. Seed Reviews
    console.log("⭐ Seeding Reviews...");
    for (let i = 0; i < 30; i++) {
      const reviewerId = faker.helpers.arrayElement(userIds);
      const businessId = faker.helpers.arrayElement(businessIds);
      
      await BusinessReview.create({
        user_id: reviewerId,
        business_id: businessId,
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        content: faker.lorem.sentence()
      }, { transaction });
    }
    console.log("✅ Reviews created.");

    await transaction.commit();
    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();

