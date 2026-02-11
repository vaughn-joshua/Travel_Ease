import { PrismaClient } from '@prisma/client';

async function fixAllSequences() {
  const prisma = new PrismaClient();
  try {
    console.log('Checking and fixing all auto-increment sequences...\n');

    // Get all tables with auto-increment columns
    const tables = await prisma.$queryRaw`
      SELECT 
        t.table_name,
        a.attname as column_name,
        pg_get_serial_sequence(t.table_name, a.attname) as sequence_name
      FROM information_schema.tables t
      JOIN pg_attribute a ON a.attrelid = (t.table_schema || '.' || t.table_name)::regclass
      WHERE t.table_schema = 'public' 
        AND pg_get_serial_sequence(t.table_name, a.attname) IS NOT NULL
      ORDER BY t.table_name
    `;

    if (tables.length === 0) {
      console.log('No auto-increment sequences found.');
      return;
    }

    console.log(`Found ${tables.length} auto-increment column(s):\n`);

    for (const table of tables) {
      const tableName = table.table_name;
      const columnName = table.column_name;
      
      try {
        // Get max value
        const maxResult = await prisma.$queryRaw`
          SELECT MAX(${columnName}) as max_val FROM ${tableName}
        `;
        const maxVal = maxResult?.[0]?.max_val || 0;

        // Get current sequence value
        const seqName = table.sequence_name;
        const currResult = await prisma.$queryRaw`
          SELECT last_value FROM pg_sequences WHERE seqname = ${seqName}
        `;
        const currSeq = currResult?.[0]?.last_value || 0;

        const status = currSeq > maxVal ? '✓' : '✗';
        console.log(`${status} ${tableName}.${columnName}`);
        console.log(`    Max in DB: ${maxVal}, Sequence at: ${currSeq}`);

        // Fix if needed
        if (currSeq <= maxVal) {
          const newValue = maxVal + 100;
          await prisma.$queryRaw`
            SELECT setval(${seqName}, ${newValue}, false)
          `;
          console.log(`    ✓ FIXED: Reset to ${newValue}`);
        } else {
          console.log(`    ✓ OK - No fix needed`);
        }
        console.log();
      } catch (err) {
        console.log(`    ✗ ERROR: Unable to fix - ${err.message}\n`);
      }
    }

    console.log('✅ Sequence check complete!');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllSequences();
