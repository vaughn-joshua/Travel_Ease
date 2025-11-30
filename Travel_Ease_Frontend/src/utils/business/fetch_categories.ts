import { endpoints } from "../../config/api";
import type { BusinessCategory } from "../../types/business";

export async function fetch_categories(
  id: number | string
): Promise<BusinessCategory[]> {
  try {
    const result = await fetch(endpoints.business.categoriesById(id), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch categories: ${result.status}`);
    }

    const data: BusinessCategory[] = await result.json();
    return data;
  } catch (e) {
    console.error("Error fetching categories:", e);
    return [];
  }
}

