import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const catCount = await prisma.business_category.count();
  const subCount = await prisma.subcategory.count();
  const businessCount = await prisma.business.count();
  const accCount = await prisma.accommodation.count();
  console.log('business_category count:', catCount);
  console.log('subcategory count:', subCount);
  console.log('business count:', businessCount);
  console.log('accommodation count:', accCount);

  // Check what categories look like
  const sampleCats = await prisma.business_category.findMany({ 
    take: 5,
    include: { subcategory: true }
  });
  console.dir(sampleCats, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
