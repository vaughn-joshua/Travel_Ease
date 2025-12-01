import { faker } from "@faker-js/faker";
import { prisma } from "../../src/lib/prisma.js";

async function seedDatabase(): Promise<void> {
  console.log("🌱 Starting Database Seeding...");
    
  try {
    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 0. Reset Database (delete in order to respect FK constraints)
      console.log("🔥 Resetting Database...");
      
      await tx.businessReview.deleteMany();
      await tx.travelPlanReview.deleteMany();
      await tx.travelPlanFavorite.deleteMany();
      await tx.businessFavorite.deleteMany();
      await tx.activity.deleteMany();
      await tx.participant.deleteMany();
      await tx.travelPlan.deleteMany();
      await tx.priceRange.deleteMany();
      await tx.businessCategory.deleteMany();
      await tx.menuItem.deleteMany();
      await tx.businessHours.deleteMany();
      await tx.business.deleteMany();
      await tx.blog.deleteMany();
      await tx.user.deleteMany();
      
      console.log("✅ Database reset.");

      // 1. Seed Users (10 Users)
      console.log("👤 Seeding Users...");
      const userIds: number[] = [];
      for (let i = 0; i < 10; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });
        const contactNo = faker.phone.number();

        const user = await tx.user.create({
          data: {
            first_name: firstName,
            last_name: lastName,
            email,
            contact_no: contactNo,
            auth_provider: 'email',
            profile_completed: true
          }
        });
        
        userIds.push(user.user_id);
      }
      console.log(`✅ Created ${userIds.length} users.`);

      // 2. Seed Businesses (20 Businesses)
      console.log("🏢 Seeding Businesses...");
      const businessIds: number[] = [];
      const categories = ['food', 'drinks', 'accomodation', 'souvenir_shop', 'nature', 'night_life', 'leisure', 'activities', 'local_offers'] as const;
      
      for (let i = 0; i < 20; i++) {
        const ownerId = faker.helpers.arrayElement(userIds);
        const name = faker.company.name();
        const desc = faker.company.catchPhrase();
        // Tagaytay Coordinates: Approx Lat 14.09 - 14.13, Lng 120.90 - 121.00
        const lat = faker.location.latitude({ min: 14.09, max: 14.13, precision: 6 });
        const lng = faker.location.longitude({ min: 120.90, max: 121.00, precision: 6 });
        
        const business = await tx.business.create({
          data: {
            user_id: ownerId,
            name,
            description: desc,
            latitude: lat,
            longtitude: lng,
            rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
            status: true
          }
        });
        
        businessIds.push(business.business_id);

        // Add a category for this business
        const category = faker.helpers.arrayElement(categories);
        await tx.businessCategory.create({
          data: {
            business_id: business.business_id,
            category_name: category as any
          }
        });
      }
      console.log(`✅ Created ${businessIds.length} businesses.`);

      // 3. Seed Travel Plans
      console.log("✈️ Seeding Travel Plans...");
      const planIds: number[] = [];
      for (let i = 0; i < 15; i++) {
        const ownerId = faker.helpers.arrayElement(userIds);
        const name = faker.lorem.words(3) + " Trip";
        const startDate = faker.date.future();
        const endDate = faker.date.future({ refDate: startDate });
        
        const plan = await tx.travelPlan.create({
          data: {
            name,
            user_id: ownerId,
            start_date: startDate,
            end_date: endDate,
            description: faker.lorem.sentence(),
            status: 'Active',
            location: faker.location.city()
          }
        });
        
        planIds.push(plan.travel_plan_id);
      }
      console.log(`✅ Created ${planIds.length} travel plans.`);

      // 4. Seed Reviews
      console.log("⭐ Seeding Reviews...");
      for (let i = 0; i < 30; i++) {
        const reviewerId = faker.helpers.arrayElement(userIds);
        const businessId = faker.helpers.arrayElement(businessIds);
        
        await tx.businessReview.create({
          data: {
            user_id: reviewerId,
            business_id: businessId,
            rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
            content: faker.lorem.sentence()
          }
        });
      }
      console.log("✅ Reviews created.");
    });

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();

