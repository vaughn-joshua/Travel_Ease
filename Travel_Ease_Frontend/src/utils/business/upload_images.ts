import { endpoints } from '../../config/api';

interface UploadResponse {
  urls?: string[];
  error?: string;
  [key: string]: unknown;
}

export async function upload_images(formData: FormData | FileList): Promise<UploadResponse | null> {
  // Convert FileList to FormData if needed
  if (formData instanceof FileList) {
    const fd = new FormData();
    for (let i = 0; i < formData.length; i++) {
      fd.append('files', formData[i]);
    }
    formData = fd;
  }
  try {
    const token = localStorage.getItem('token');
    const result = await fetch(endpoints.utils.uploadImages, {
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
