import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const bizCount = await prisma.business.count();
    const catCount = await prisma.business_category.count();
    const subCount = await prisma.subcategory.count();
    
    console.log(`Total Businesses: ${bizCount}`);
    console.log(`Total Business-Category Links: ${catCount}`);
    console.log(`Total Subcategories: ${subCount}`);

    if (catCount === 0 && bizCount > 0) {
      console.log('WARNING: You have businesses but NO categories assigned to them.');
      
      const sampleBiz = await prisma.business.findFirst({
        select: { business_id: true, name: true, business_category: true }
      });
      console.log('Sample Business:', JSON.stringify(sampleBiz, null, 2));
    } else {
        const sampleBiz = await prisma.business.findFirst({
            where: { business_category: { some: {} } },
            select: { business_id: true, name: true, business_category: { include: { subcategory: true } } }
        });
        console.log('Sample Business with category:', JSON.stringify(sampleBiz, null, 2));
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
checkCategories();
