import express from "express";
import cors from "cors";
import axios from "axios";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
  utils_routes,
} from "./routes/index.js";
const app = express();

app.use(express.json()); // parse application/json

app.use(cors()); //for testing

//routes

app.use("/api/travel_plan", travel_plan_routes);

app.use("/api/user", user_routes);

app.use("/api/utils", utils_routes);

app.use("/api/config", config_routes);

app.get("/api/suggestions", (req, res) => {
  res.json({ message: "accessed backend" });

  try {
    const nominatim_url = ``;
  } catch (error) {}
});

app.post("/api/search", async (req, res) => {
  const { street, brgy } = req.body;
  console.log(req.body);

  try {
    const nominatim_url =
      `https://nominatim.openstreetmap.org/search?` +
      `street=${encodeURIComponent(street)}` +
      `&neighbourhood=${encodeURIComponent(brgy)}` +
      `&city=Pasay` +
      `&country=Philippines` +
      `&format=json` +
      `&limit=5` +
      `&addressdetails=1`;

    const response = await axios.get(nominatim_url, {
      headers: {
        "User-Agent": "TravelEaseApp/1.0 (joshuabarit77@gmail.com)",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.log(error);
  }
});

//server

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
