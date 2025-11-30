import { endpoints } from "../../config/api";
import type { UpdateBusinessPayload, Business } from "../../types/business";

export async function business_edit(
  id: number | string,
  data: UpdateBusinessPayload
): Promise<Business | undefined> {
  try {
    const result = await fetch(endpoints.business.edit(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(`Failed to update business: ${result.status}`);
    }

    const responseData: Business = await result.json();
    return responseData;
  } catch (e) {
    console.error("Error updating business:", e);
    throw e;
  }
}

