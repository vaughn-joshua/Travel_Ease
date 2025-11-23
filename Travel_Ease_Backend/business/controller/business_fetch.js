import { con } from "../../config/travelease_db.js";

export async function business_fetch(req, res) {
  const { id } = req.params;
  try {
    const query = {
      text: `
    SELECT
      b.*,
      json_agg(
        DISTINCT jsonb_build_object(
          'category_id', c.category_id,
          'category_name', c.category_name,
          'price_range', jsonb_build_object(
            'min_price', pr.min_price,
            'max_price', pr.max_price
          )
        )
      ) FILTER (WHERE c.category_id IS NOT NULL) AS categories,

      (
        SELECT json_agg(
          jsonb_build_object(
            'day_of_week', bh.day_of_week,
            'open_time', bh.open_time,
            'close_time', bh.close_time
          )
        )
        FROM public.business_hours bh
        WHERE bh.business_id = b.business_id
      ) AS business_hours

    FROM public.business b
    LEFT JOIN public.business_category c
      ON c.business_id = b.business_id

    LEFT JOIN (
      SELECT
        category_id,
        MIN(min_price) AS min_price,
        MAX(max_price) AS max_price
      FROM public.price_range
      GROUP BY category_id
    ) pr ON pr.category_id = c.category_id

    WHERE b.business_id = $1
    GROUP BY b.business_id;
  `,
      values: [id],
    };

    const result = await con.query(query);

    console.log(result.rows);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
}
