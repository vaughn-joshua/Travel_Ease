import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
  utils_routes,
  business_routes,
} from "./routes/index.js";
import { con } from "./config/travelease_db.js";
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json()); // parse application/json

//routes
app.use("/api/travel_plan", travel_plan_routes);

app.use("/api/user", user_routes);

app.use("/api/utils", utils_routes);

app.use("/api/config", config_routes);

app.use("/api/business", business_routes);

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

app.get("/api/travel_spots/reviews/:id", async (req, res)=> {
   const businessId = req.params.id;
   try {
    const result = await con.query("SELECT * from business_review WHERE business_id = $1 ORDER BY review_date DESC", [businessId]);
    res.json({
      message: "Success", 
      data: result.rows
    })
   } catch (error) {
    console.error("Error fetching reviews: ", error);
    res.status(500).json({ message: "Server Error", error: error.message });
   }
})
//map routes
app.get("/api/suggestions", async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 3) {
    return res.json([]);
  }
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )},Tagaytay%20City&countrycodes=ph&limit=5`;

  try {
    const response = await axios.get(nominatimUrl);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching suggestions:", error.message);
    res.status(500).json({ error: "Error fetching suggestions" });
  }
});

app.get("/api/search", async (req, res) => {
  const { query } = req.query; // Get the query from React

  if (!query) {
    return res.json([]);
  }

  // This is your complex URL with the 'viewbox'
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=120.92,14.15,120.97,14.07`;

  try {
    // Call Nominatim from the server
    const response = await axios.get(nominatimUrl);
    res.json(response.data); // Send the response back to React
  } catch (error) {
    console.error("Error fetching search:", error.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.get("/api/geocode", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }

  // This is the FLEXIBLE query. It does NOT have 'bounded=1'.
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&countrycodes=ph&viewbox=120.92,14.15,120.97,14.07`;

  try {
    const response = await axios.get(nominatimUrl);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching geocode:", error.message);
    res.status(500).json({ error: "Failed to fetch geocode results" });
  }
});

//server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
