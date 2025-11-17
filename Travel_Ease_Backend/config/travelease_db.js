import { Client, types } from "pg";

// OID 1082 is the Postgres OID for 'DATE'
types.setTypeParser(1082, (val) => val);

export const con = new Client({
  user: "postgres",
  host: "localhost",
  database: "travelease_db2",
  password: "123",
  port: 5432,
});

con
  .connect()
  .then(() => {
    console.log("Connected to the database 1");
  })
  .catch((err) => {
    console.error("Connection error", err.stack);
  });
