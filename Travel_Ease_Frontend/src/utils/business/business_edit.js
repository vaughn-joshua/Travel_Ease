import { endpoints } from '../../config/api.js';

export async function business_edit(id, submitted) {
  try {
    const result = await fetch(endpoints.business.edit(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitted),
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
