import { prisma } from "../../../lib/prisma.js";

interface CategoryInput {
  category_id?: number;
  category_name: string;
}

/**
 * Update business categories - handles add/update/delete
 * @param business_id - Business ID
 * @param categories - Array of {category_id?, category_name}
 */
export async function updateBusinessCategories(business_id: number, categories: CategoryInput[]) {
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
      .map(c => c.category_id!);

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
          data: { category_name: c.category_name as any }
        });
      } else {
        // Insert new
        await tx.businessCategory.create({
          data: {
            business_id,
            category_name: c.category_name as any
          }
        });
      }
    }

    return { success: true, message: "Categories updated successfully" };
  });
}

