import { con } from "../travelease_db.js";

export async function init_db(req, res) {
  try {
    initDB();

    const result = await con.query('SELECT * FROM "User"');
    res.json({
      message: "Hello World!",
      users: result.rows,
    });
  } catch (error) {
    console.error("Error executing query", error.stack);
    res.status(500).send("Internal Server Error");
  }
}
