import { endpoints } from '../../config/api';

interface Business {
  business_id: number;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export async function fetch_business(id: number | string): Promise<Business | null> {
  try {
    const result = await fetch(endpoints.business.byId(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}
