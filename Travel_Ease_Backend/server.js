import express from "express";
import cors from "cors";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
} from "./routes/index.js";
import { con } from "./config/travelease_db.js";
const app = express();

app.use(express.json()); // parse application/json

app.use(cors()); //for testing

//routes

app.use("/api/travel_plan", travel_plan_routes);

app.use("/api/user", user_routes);

app.use("/api/config", config_routes);

//server
app.get("/api/travel_spots", async (req ,res) => {
  try {
      const result = await con.query("SELECT business_id, user_id, name, house_number, street, brgy, city, latitude, longtitude, description, rating, status, picture FROM business");
      res.json({
        message: 'Success',
        data: result.rows,
      })
  } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
  }

})

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
