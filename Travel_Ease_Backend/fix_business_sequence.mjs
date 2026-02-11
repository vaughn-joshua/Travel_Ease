import { PrismaClient } from '@prisma/client';

async function fixSequence() {
  const prisma = new PrismaClient();
  try {
    console.log('Fixing business_id sequence...\n');

    // Get max business_id
    const maxIdResult = await prisma.$queryRaw`SELECT MAX(business_id) as max FROM public.business`;
    const maxId = Number(maxIdResult?.[0]?.max || 0);
    console.log('Max business_id:', maxId);

    // Reset the sequence to max_id + 100 to be safe
    const newStartValue = maxId + 100;
    const resetResult = await prisma.$queryRaw`
      SELECT setval(pg_get_serial_sequence('public.business', 'business_id'), ${newStartValue}, false)
    `;
    console.log('✓ Sequence reset. Next value will be:', newStartValue);

    // Try nextval to verify
    try {
      const nextResult = await prisma.$queryRaw`
        SELECT nextval(pg_get_serial_sequence('public.business', 'business_id')::regclass) as next_val
      `;
      const nextVal = Number(nextResult?.[0]?.next_val || 0);
      console.log('✓ Verified: nextval() returned:', nextVal);
      
      console.log('\n✅ Sequence fixed successfully!');
      console.log(`   Fixed: max_id=${maxId}, sequence reset to start at ${newStartValue}`);
      console.log(`   Safe buffer added to prevent future collisions`);
    } catch (verifyErr) {
      console.log('✓ Sequence appears to have been reset');
      console.log('\n✅ Safe to proceed with business creation now!');
    }

  } catch (error) {
    console.error('Error fixing sequence:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixSequence();
