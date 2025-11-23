import { con } from "../../config/travelease_db.js";
import { updateBusinessCategories } from "../util/updateBusinessCategories.js";

export async function edit_business(req, res) {
  try {
    const { id } = req.params;

    console.log(id);
    console.log(req.body);

    // update business_category with "category_id" as reference
    const { categories } = req.body;

    await updateBusinessCategories(con, id, categories);

    // update price_range with "category_id"

    //update business_hours with "id"

    // update business with "id"
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}
