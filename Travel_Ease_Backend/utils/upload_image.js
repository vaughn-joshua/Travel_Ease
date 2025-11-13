import cloudinary from "../config/cloudinary_config.js";

export async function upload_image(req, res) {
  try {
    console.log("REQ FILE:", req.file);
    console.log("REQ BODY:", req.body);
    const image_data = req.file.buffer;
    const image_base64 = image_data.toString("base64");

    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${image_base64}`,
      {
        folder: "Travel_Ease",
      }
    );

    console.log(result.secure_url);

    res.json({
      message: "you are at backend",
      file: req.file,
      secure_url: result.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}
