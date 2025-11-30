import { endpoints } from "../../config/api";
import type { UploadResponse } from "../../types/api";

export async function upload_image(file: File): Promise<UploadResponse | undefined> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const result = await fetch(endpoints.utils.upload, {
      method: "POST",
      body: formData,
    });

    if (!result.ok) {
      throw new Error(`Failed to upload image: ${result.status}`);
    }

    const data: UploadResponse = await result.json();
    return data;
  } catch (e) {
    console.error("Error uploading image:", e);
    throw e;
  }
}

