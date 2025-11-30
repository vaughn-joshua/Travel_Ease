import { endpoints } from "../../config/api";
import type { MultiUploadResponse } from "../../types/api";

export async function upload_images(files: FileList | File[]): Promise<MultiUploadResponse | undefined> {
  try {
    const formData = new FormData();
    
    const fileArray = Array.from(files);
    fileArray.forEach((file) => {
      formData.append("images", file);
    });

    const result = await fetch(endpoints.utils.uploadImages, {
      method: "POST",
      body: formData,
    });

    if (!result.ok) {
      throw new Error(`Failed to upload images: ${result.status}`);
    }

    const data: MultiUploadResponse = await result.json();
    return data;
  } catch (e) {
    console.error("Error uploading images:", e);
    throw e;
  }
}

