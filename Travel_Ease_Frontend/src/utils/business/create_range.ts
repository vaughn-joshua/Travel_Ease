import { endpoints } from '../../config/api';

interface PriceRangeData {
  id?: number;
  business_id?: string | number;
  categories?: Array<{
    category_id: number;
    min_price: number;
    max_price: number;
  }>;
  min?: number;
  max?: number;
  [key: string]: unknown;
}

export async function create_range(submitted: PriceRangeData): Promise<unknown> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.business.priceRange, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(submitted),
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}
