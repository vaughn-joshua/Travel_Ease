import cloudinary from "../config/cloudinary_config.js";

export async function upload_images(req, res) {
  try {
    console.log("you are at upload images");
    const files = req.files;

    // Handle array field names with [] suffix (e.g., names[], folders[])
    // Body parser might parse these as 'names[]' keys or as 'names' arrays
    let names = req.body.names || req.body['names[]'];
    let folders = req.body.folders || req.body['folders[]'];

    // Ensure arrays
    if (!Array.isArray(names)) {
      // Could be a JSON string or single value
      try {
        names = JSON.parse(names);
      } catch {
        names = names ? [names] : [];
      }
    }

    if (!Array.isArray(folders)) {
      try {
        folders = JSON.parse(folders);
      } catch {
        folders = folders ? [folders] : [];
      }
    }

    console.log("Files:", files?.length || 0);
    console.log("Names:", names);
    console.log("Folders:", folders);

    // Validate files exist
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (names.length !== files.length) {
      return res.status(400).json({ 
        error: `Mismatch: ${files.length} files but ${names.length} names provided` 
      });
    }

    const secure_urls = [];

    for (let i = 0; i < files.length; i++) {
      const imageData = files[i].buffer;
      const imageBase64 = imageData.toString("base64");
      const folder = folders[i] || folders[0] || "uploads";
      const publicId = names[i] || `upload_${Date.now()}_${i}`;

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
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
}
