import express from "express";
import cors from "cors";
import axios from "axios";
import {
  travel_plan_routes,
  user_routes,
  config_routes,
  business_routes,
} from "./routes/index.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json()); // parse application/json

//routes
app.use("/api/travel_plan", travel_plan_routes);

app.use("/api/user", user_routes);

app.use("/api/config", config_routes);

app.use("/api/business", business_routes);

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
