import { prisma } from "../../src/lib/prisma.js";

export async function create_business(req, res) {
  const {
    name,
    house_no,
    street,
    brgy,
    city,
    description,
    lat,
    lng,
    secure_url,
    business_hrs,
    category,
    min_price,
    max_price,
  } = req.body;

  // Use authenticated user ID from middleware
  const userId = req.user.id;

  try {
    // Create business with related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create business
      const business = await tx.business.create({
        data: {
          user_id: userId,
          name,
          house_number: house_no,
          street,
          brgy,
          city,
          latitude: lat,
          longtitude: lng,
          description,
          picture: secure_url,
        },
      });

      // Create business hours
      if (business_hrs && business_hrs.length > 0) {
        await tx.businessHours.createMany({
          data: business_hrs.map((hrs) => ({
            business_id: business.business_id,
            day_of_week: hrs.day,
            open_time: hrs.start ? new Date(`1970-01-01T${hrs.start}`) : null,
            close_time: hrs.end ? new Date(`1970-01-01T${hrs.end}`) : null,
          })),
        });
      }

      // Create business categories and price ranges
      if (category && category.length > 0) {
        // Create categories first
        await tx.businessCategory.createMany({
          data: category.map((cat) => ({
            business_id: business.business_id,
            category_name: cat,
          })),
        });

        // If price range provided, create price ranges for each category
        if (min_price !== undefined || max_price !== undefined) {
          const createdCategories = await tx.businessCategory.findMany({
            where: { business_id: business.business_id },
            select: { category_id: true },
          });

          if (createdCategories.length > 0) {
            await tx.priceRange.createMany({
              data: createdCategories.map((cat) => ({
                category_id: cat.category_id,
                min_price: min_price || 0,
                max_price: max_price || 0,
              })),
            });
          }
        }
      }

      return business;
    });

    res.status(201).json({ 
      message: "successfully created a business",
      business_id: result.business_id
    });
  } catch (error) {
    console.error("Error creating business:", error);
    res.status(500).json({ error: error.message });
  }
}
