import { endpoints } from "../../config/api";
import type { PriceRange } from "../../types/business";

interface CreateRangePayload {
  business_id: number | string;
  min: number;
  max: number;
}

interface CreateRangeResponse {
  message: string;
  priceRange: PriceRange;
}

export async function create_range(
  data: CreateRangePayload
): Promise<CreateRangeResponse | undefined> {
  try {
    const result = await fetch(endpoints.business.priceRange, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to create price range: ${result.status}`);
    }

    const responseData: CreateRangeResponse = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating price range:", e);
    throw e;
  }
}

