import api from "../../services/api";

export interface UploadResponse {
  urls?: string[];
  secure_url?: string[];
  error?: string;
  [key: string]: unknown;
}

export async function upload_images(
  formData: FormData | FileList
): Promise<UploadResponse | null> {
  // Convert FileList to FormData if needed
  if (formData instanceof FileList) {
    const fd = new FormData();
    for (let i = 0; i < formData.length; i++) {
      fd.append("files", formData[i]);
    }
    formData = fd;
  }

  try {
    const response = await api.post("/utils/upload_images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (e) {
    console.error("Error uploading images:", e);
    return null;
  }
}
