import { Router } from "express";
import axios from "axios";

const router = Router();

// Search endpoint with POST method (for intersection/address search)
router.post("/search", async (req, res) => {
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

// Suggestions endpoint (for autocomplete)
router.get("/suggestions", async (req, res) => {
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

// Search endpoint with GET method (bounded search for Tagaytay)
router.get("/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json([]);
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=120.92,14.15,120.97,14.07`;

  try {
    const response = await axios.get(nominatimUrl);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching search:", error.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Geocode endpoint (flexible search)
router.get("/geocode", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }

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

export default router;

