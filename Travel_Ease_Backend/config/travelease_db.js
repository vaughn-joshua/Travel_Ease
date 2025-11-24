import "dotenv/config";
import { Pool, types } from "pg";

// OID 1082 is the Postgres OID for 'DATE'
types.setTypeParser(1082, (val) => val);

export const con = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

con.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});
