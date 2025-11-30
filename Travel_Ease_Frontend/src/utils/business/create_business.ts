import { endpoints } from "../../config/api";
import type { CreateBusinessPayload, CreateBusinessResponse } from "../../types/business";

export async function create_business(
  data: CreateBusinessPayload
): Promise<CreateBusinessResponse | undefined> {
  try {
    const result = await fetch(endpoints.business.create, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to create business: ${result.status}`);
    }

    const responseData: CreateBusinessResponse = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error creating business:", e);
    throw e;
  }
}

