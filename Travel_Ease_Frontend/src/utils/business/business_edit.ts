import { endpoints } from '../../config/api';

interface EditBusinessData {
  [key: string]: unknown;
}

export async function business_edit(submitted: EditBusinessData, id: number | string): Promise<unknown> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.business.edit(id), {
      method: 'PUT',
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
