import { PrismaClient } from '@prisma/client';

async function diagnoseSequence() {
  const prisma = new PrismaClient();
  try {
    console.log('Diagnosing business_id sequence issue...\n');

    // Get max business_id
    const maxIdResult = await prisma.$queryRaw`SELECT MAX(business_id) as max FROM public.business`;
    const maxId = maxIdResult?.[0]?.max || 0;
    console.log('✓ Max business_id in database:', maxId);

    // Count businesses
    const count = await prisma.business.count();
    console.log('✓ Total businesses:', count);

    // Get sequence info
    try {
      const seqInfo = await prisma.$queryRaw`SELECT schemaname, seqname FROM pg_sequences WHERE seqname LIKE '%business_id%'`;
      console.log('✓ Sequence info found:', seqInfo?.length || 0, 'sequences');
    } catch (e) {
      console.log('  (Could not get sequence via pg_sequences)');
    }

    // Try to check the actual next value that would be generated
    try {
      const nextValResult = await prisma.$queryRaw`SELECT nextval(pg_get_serial_sequence('public.business', 'business_id')::regclass) as next_val`;
      const nextVal = nextValResult?.[0]?.next_val;
      console.log('✓ Next sequence value (consumed):', nextVal);
      
      // But we just consumed it, so let's immediately check again
      const currentVal = await prisma.$queryRaw`SELECT currval(pg_get_serial_sequence('public.business', 'business_id')::regclass) as current_val`;
      const curr = currentVal?.[0]?.current_val;
      console.log('✓ Current sequence value:', curr);

      console.log('\n=== DIAGNOSIS ===');
      if ((curr || 0) <= maxId) {
        console.log('❌ SEQUENCE IS OUT OF SYNC!');
        console.log(`   Sequence is at ${curr}, but max ID in DB is ${maxId}`);
        console.log(`   Next insert would try to use ID ${(curr || 0) + 1}, which already exists!`);
        console.log('\nFIX: Run this command:');
        console.log(`   npm run fix:sequence`);
        console.log('\nOr manually in database:');
        console.log(`   SELECT setval(pg_get_serial_sequence('public.business', 'business_id'), ${maxId} + 1, true);`);
      } else {
        console.log('✅ Sequence appears healthy');
        console.log(`   Current: ${curr}, Max in DB: ${maxId}`);
      }
    } catch (seqError) {
      console.log('⚠️  Could not determine sequence status:', seqError.message);
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseSequence();
