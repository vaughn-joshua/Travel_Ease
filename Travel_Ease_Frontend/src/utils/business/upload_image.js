import { endpoints } from '../../config/api.js';

export async function upload_image(formData) {
  try {
    const result = await fetch(endpoints.utils.upload, {
      method: "POST",
      body: formData,
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
