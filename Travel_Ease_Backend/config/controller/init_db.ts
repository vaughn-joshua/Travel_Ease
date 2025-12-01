import { con } from "../travelease_db.js";
import { Request, Response } from "express";

export async function init_db(req: Request, res: Response): Promise<void> {
  try {
    const result = await con.query('SELECT * FROM "User"');
    res.json({
      message: "Hello World!",
      users: result.rows,
    });
  } catch (error) {
    console.error("Error executing query", (error as Error).stack);
    res.status(500).send("Internal Server Error");
  }
}

