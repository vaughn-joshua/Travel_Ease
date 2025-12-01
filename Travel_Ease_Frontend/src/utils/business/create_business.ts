import { endpoints } from '../../config/api';

interface CreateBusinessData {
  name: string;
  description?: string;
  house_no?: string;
  street?: string;
  brgy?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  secure_url?: string;
  category?: string[];
  categoryIds?: number[];
  hours?: unknown;
  address?: string;
  business_hrs?: Array<{ day: string; start?: string; end?: string }>;
  [key: string]: unknown;
}

export async function create_business(submitted: CreateBusinessData): Promise<unknown> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.business.create, {
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
