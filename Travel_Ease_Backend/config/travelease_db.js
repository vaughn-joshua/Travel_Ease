import { Client } from "pg";

export const con = new Client({
  user: "postgres",
  host: "localhost",
  database: "travelease_business_db",
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
