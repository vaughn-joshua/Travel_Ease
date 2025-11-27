import { prisma } from "../../src/lib/prisma.js";

/**
 * Update business categories - handles add/update/delete
 * @param {number} business_id - Business ID
 * @param {Array} categories - Array of {category_id?, category_name}
 */
export async function updateBusinessCategories(business_id, categories) {
  // Use Prisma transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // 1. Get existing category IDs
    const existing = await tx.businessCategory.findMany({
      where: { business_id },
      select: { category_id: true }
    });
    const existingIds = existing.map(c => c.category_id);

    // 2. Determine incoming IDs (existing categories to keep/update)
    const incomingIds = categories
      .filter(c => c.category_id)
      .map(c => c.category_id);

    // 3. Delete removed categories
    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      await tx.businessCategory.deleteMany({
        where: { category_id: { in: toDelete } }
      });
    }

    // 4. Upsert categories (insert new, update existing)
    for (const c of categories) {
      if (c.category_id) {
        // Update existing
        await tx.businessCategory.update({
          where: { category_id: c.category_id },
          data: { category_name: c.category_name }
        });
      } else {
        // Insert new
        await tx.businessCategory.create({
          data: {
            business_id,
            category_name: c.category_name
          }
        });
      }
    }

    return { success: true, message: "Categories updated successfully" };
  });
}
