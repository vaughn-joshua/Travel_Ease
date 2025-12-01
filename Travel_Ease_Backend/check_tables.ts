import { con } from "./config/travelease_db.js";

interface TableRow {
  table_name: string;
}

async function checkTables(): Promise<void> {
  try {
    const res = await con.query<TableRow>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log("📂 Tables in database:");
    res.rows.forEach(row => console.log(` - ${row.table_name}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTables();

