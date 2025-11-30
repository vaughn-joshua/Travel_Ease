import { endpoints } from '../../config/api.js';

export async function upload_images(formData) {
  try {
    const result = await fetch(endpoints.utils.uploadImages, {
      method: "POST",
      body: formData,
    });

    const data = await result.json();
    return data;
  } catch (e) {
    console.log(e);
  }
}
