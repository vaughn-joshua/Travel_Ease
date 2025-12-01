import { endpoints } from '../../config/api';

interface EditPlanData {
  name?: string;
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  max_slots?: number;
  visibility?: boolean;
  status?: string;
}

export async function edit_plan(id: number | string, data: EditPlanData): Promise<unknown> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.travelPlan.editPlan(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const response = await result.json();
    return response;
  } catch (e) {
    console.error(e);
    return null;
  }
}
