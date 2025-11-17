import cloudinary from "../config/cloudinary_config.js";

export async function upload_images(req, res) {
  try {
    console.log("you are at upload image");
    const { name, folder } = req.body;
    const image_data = req.file.buffer;
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
