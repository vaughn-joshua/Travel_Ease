import { endpoints } from '../../config/api.js';

export async function create_business(submitted) {
  try {
    const result = await fetch(endpoints.business.create, {
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
