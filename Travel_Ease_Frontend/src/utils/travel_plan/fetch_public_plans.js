import { endpoints } from '../../config/api.js';

export async function fetch_public_plans() {
  try {
    const result = await fetch(endpoints.travelPlan.public, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await result.json();
    
    // Handle paginated response format: { items: [...], total, page, pageSize, totalPages }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    // Fallback: if data is already an array, return it directly
    if (Array.isArray(data)) {
      return data;
    }
    // Default to empty array if unexpected shape
    return [];
  } catch (e) {
    console.error("Error fetching public plans:", e);
    return [];
  }
}
