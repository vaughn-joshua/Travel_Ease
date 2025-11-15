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
  let { street, brgy } = req.body;
  console.log(req.body);

  try {
    // Normalize street name
    const cleanStreet = street
      .replace(/cor\.?/i, "&")
      .replace(/corner/i, "&")
      .replace(/St\.?/gi, "Street")
      .trim();

    // 1st attempt: intersection style
    let query = `${cleanStreet}, Barangay ${brgy}, Pasay, Philippines`;

    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&addressdetails=1`;

    let response = await axios.get(url, {
      headers: { "User-Agent": "TravelEaseApp/1.0 (your_email)" },
    });

    if (response.data.length > 0) {
      console.log("Intersection MATCH:", response.data);
      return res.json(response.data);
    }

    // 2nd attempt: remove intersection symbol, use simple search
    const secondQuery = `${street}, Pasay, Philippines`;

    url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      secondQuery
    )}&format=json&limit=1&addressdetails=1`;

    response = await axios.get(url, {
      headers: { "User-Agent": "TravelEaseApp/1.0 (your_email)" },
    });

    if (response.data.length > 0) {
      console.log("Fallback MATCH:", response.data);
      return res.json(response.data);
    }

    // 3rd attempt: barangay only
    const thirdQuery = `Barangay ${brgy}, Pasay, Philippines`;

    url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      thirdQuery
    )}&format=json&limit=1&addressdetails=1`;

    response = await axios.get(url, {
      headers: { "User-Agent": "TravelEaseApp/1.0 (your_email)" },
    });

    console.log("Barangay MATCH:", response.data);
    return res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

//server

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
