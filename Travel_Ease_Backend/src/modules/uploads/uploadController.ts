import cloudinary from "../../../config/cloudinary_config.js";
import { Request, Response } from "express";

interface MulterRequest extends Omit<Request, 'file'> {
  file?: {
    buffer: Buffer;
    mimetype: string;
  };
}

interface MulterFile {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Upload a single image
 * POST /api/utils/upload
 */
export async function upload_image(req: MulterRequest, res: Response) {
  try {
    console.log("you are at upload image");
    const { name, folder } = req.body;
    const image_data = req.file!.buffer;
    const image_base64 = image_data.toString("base64");

    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${image_base64}`,
      {
        folder: folder,
        public_id: name,
      }
    );

    console.log(result.secure_url);

    res.json({ secure_url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}

/**
 * Upload multiple images
 * POST /api/utils/upload_images
 */
export async function upload_images(req: Request, res: Response): Promise<Response | void> {
  try {
    console.log("you are at upload images");
    const files = Array.isArray(req.files) ? req.files as MulterFile[] : undefined;

    // Handle array field names with [] suffix (e.g., names[], folders[])
    // Body parser might parse these as 'names[]' keys or as 'names' arrays
    let rawNames: any = req.body.names || req.body['names[]'];
    let rawFolders: any = req.body.folders || req.body['folders[]'];

    // Ensure arrays
    let namesArr: string[];
    let foldersArr: string[];
    
    if (!Array.isArray(rawNames)) {
      // Could be a JSON string or single value
      try {
        namesArr = JSON.parse(rawNames);
        if (!Array.isArray(namesArr)) namesArr = [namesArr];
      } catch {
        namesArr = rawNames ? [rawNames] : [];
      }
    } else {
      namesArr = rawNames;
    }

    if (!Array.isArray(rawFolders)) {
      try {
        foldersArr = JSON.parse(rawFolders);
        if (!Array.isArray(foldersArr)) foldersArr = [foldersArr];
      } catch {
        foldersArr = rawFolders ? [rawFolders] : [];
      }
    } else {
      foldersArr = rawFolders;
    }

    console.log("Files:", files?.length || 0);
    console.log("Names:", namesArr);
    console.log("Folders:", foldersArr);

    // Validate files exist
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (namesArr.length !== files.length) {
      return res.status(400).json({ 
        error: `Mismatch: ${files.length} files but ${namesArr.length} names provided` 
      });
    }

    const secure_urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const imageData = files[i].buffer;
      const imageBase64 = imageData.toString("base64");
      const folder = foldersArr[i] || foldersArr[0] || "uploads";
      const publicId = namesArr[i] || `upload_${Date.now()}_${i}`;

      // Detect mime type from buffer or default to png
      let mimeType = "image/png";
      if (files[i].mimetype) {
        mimeType = files[i].mimetype;
      }

      const result = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${imageBase64}`,
        {
          folder: folder,
          public_id: publicId,
        }
      );

      secure_urls.push(result.secure_url);
    }

    res.json({ secure_url: secure_urls });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
}

