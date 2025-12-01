import { endpoints } from '../../config/api';

interface EditActivityDateData {
  activity_id: number;
  target_date?: string;
  [key: string]: unknown;
}

export async function edit_activity_date(edited_data: EditActivityDateData): Promise<unknown> {
  try {
    const result = await fetch(endpoints.travelPlan.editActivity(edited_data.activity_id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(edited_data),
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}
