import { endpoints } from "../../config/api";
import type { Business } from "../../types/business";

export async function fetch_business(id: number | string): Promise<Business | undefined> {
  try {
    const result = await fetch(endpoints.business.byId(id), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch business: ${result.status}`);
    }

    const data: Business = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching business:", e);
    return undefined;
  }
}

