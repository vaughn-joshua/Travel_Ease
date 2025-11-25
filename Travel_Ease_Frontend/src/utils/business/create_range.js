import { endpoints } from '../../config/api.js';

export async function create_range(submitted) {
  try {
    const result = await fetch(endpoints.business.priceRange, {
      method: "POST",
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
