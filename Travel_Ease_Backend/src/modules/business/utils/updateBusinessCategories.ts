import { prisma } from "../../../lib/prisma.js";

interface CategoryInput {
  category_id?: number;
  subcategory_id: number;
}

/**
 * Update business categories - handles add/update/delete
 * @param business_id - Business ID
 * @param categories - Array of {category_id?, subcategory_id}
 */
export async function updateBusinessCategories(business_id: number, categories: CategoryInput[]) {
  // Use Prisma transaction for atomicity
  return await prisma.$transaction(async (tx) => {
    // 1. Get existing category IDs
    const existing = await tx.business_category.findMany({
      where: { business_id },
      select: { category_id: true }
    });
    const existingIds = existing.map(c => c.category_id);

    // 2. Determine incoming IDs (existing categories to keep/update)
    const incomingIds = categories
      .filter(c => c.category_id)
      .map(c => c.category_id!);

    // 3. Delete removed categories
    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length > 0) {
      await tx.business_category.deleteMany({
        where: { category_id: { in: toDelete } }
      });
    }

    // 4. Upsert categories (insert new, update existing)
    for (const c of categories) {
      if (c.category_id) {
        // Update existing
        await tx.business_category.update({
          where: { category_id: c.category_id },
          data: { subcategory_id: c.subcategory_id }
        });
      } else {
        // Insert new
        await tx.business_category.create({
          data: {
            business_id,
            subcategory_id: c.subcategory_id
          }
        });
      }
    }

    return { success: true, message: "Categories updated successfully" };
  });
}

