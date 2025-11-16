import { con } from "../../config/travelease_db.js";

export async function create_business(req, res) {
  const {
    name,
    house_no,
    street,
    brgy,
    city,
    description,
    lat,
    lng,
    secure_url,
    business_hrs,
    category,
  } = req.body;

  const id = 1;

  console.log("you are at backend create business");

  try {
    // post on business table
    const business_query = {
      name: "ceate business",
      text: `INSERT INTO public.business
                  (user_id, name, house_number, street, brgy, city, latitude, longtitude, description, picture)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                  RETURNING business_id;`,
      values: [
        id,
        name,
        house_no,
        street,
        brgy,
        city,
        lat,
        lng,
        description,
        secure_url,
      ],
    };

    const result = await con.query(business_query);

    const business_id = result.rows[0].business_id;

    // post on business hours table
    for (let i = 0; i < business_hrs.length; i++) {
      const hours_query = {
        text: `INSERT INTO public.business_hours
                (business_id, day_of_week, open_time, close_time)
                VALUES ($1, $2, $3, $4)`,
        values: [
          business_id,
          business_hrs[i].day,
          business_hrs[i].start,
          business_hrs[i].end,
        ],
      };

      const result = await con.query(hours_query);
    }

    res.json({ message: "successfully created a business" });

    //post on category table
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}
