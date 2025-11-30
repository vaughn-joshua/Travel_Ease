import { endpoints } from '../../config/api.js';

export async function fetch_business(id) {
  try {
    const result = await fetch(endpoints.business.byId(id), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
