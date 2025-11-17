import { con } from "../../config/travelease_db.js";

export async function price_range(req, res) {
  const { categories, menu } = req.body;

  const id = 1;

  console.log("creating range...");

  try {
    // post on business hours table
    for (let i = 0; i < categories.length; i++) {
      const range_query = {
        text: `INSERT INTO public.price_range
                (category_id, min_price, max_price)
                VALUES ($1, $2, $3)`,
        values: [
          categories[i].category_id,
          categories[i].min_price,
          categories[i].max_price,
        ],
      };

      const result = await con.query(range_query);
    }

    res.json({ message: "successfully input price_range/s" });

    //post on category table
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}
