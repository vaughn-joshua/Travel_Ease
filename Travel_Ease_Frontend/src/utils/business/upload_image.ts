import { endpoints } from '../../config/api';

interface UploadResponse {
  secure_url?: string;
  url?: string;
  error?: string;
  [key: string]: unknown;
}

export async function upload_image(formData: FormData): Promise<UploadResponse | null> {
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.utils.upload, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}
