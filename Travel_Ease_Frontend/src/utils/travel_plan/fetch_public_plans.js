import { endpoints } from '../../config/api.js';

export async function fetch_public_plans() {
  try {
    const res = await fetch(endpoints.travelPlan.public, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Public plans failed: ${res.status}`);
    }

    const json = await res.json();

    // Backend returns { data: [...], pagination: {...} }
    if (json && Array.isArray(json.data)) {
      return json.data;
    }
    // Fallback: if json is already an array, return it directly
    if (Array.isArray(json)) {
      return json;
    }
    // Default to empty array if unexpected shape
    return [];
  } catch (e) {
    console.error("Error fetching public plans:", e);
    return [];
  }
}
