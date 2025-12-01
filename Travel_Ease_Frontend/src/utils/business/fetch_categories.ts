import { endpoints } from '../../config/api';

interface Category {
  category_id: number;
  name: string;
  [key: string]: unknown;
}

export async function fetch_categories(id: number | string): Promise<Category[] | null> {
  try {
    const result = await fetch(endpoints.business.categoriesById(id), {
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
