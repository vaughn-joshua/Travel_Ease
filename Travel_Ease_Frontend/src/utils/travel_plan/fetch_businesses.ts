import { endpoints } from "../../config/api";
import type { Business } from "../../types/business";

export async function fetch_businesses(): Promise<Business[]> {
  try {
    const result = await fetch(endpoints.business.travelSpots, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch businesses: ${result.status}`);
    }

    const data: Business[] = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching businesses:", e);
    return [];
  }
}

