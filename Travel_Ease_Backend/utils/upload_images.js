import cloudinary from "../config/cloudinary_config.js";

export async function upload_images(req, res) {
  try {
    console.log("you are at upload image");
    const file = req.files;
    const names = req.body.names;
    const folders = req.body.folders;

    let secure_url = [];

    console.log(file);
    console.log(names);
    console.log(folders);

    for (let i = 0; i < names.length; i++) {
      const image_data = file[i].buffer;
      const image_base64 = image_data.toString("base64");

      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${image_base64}`,
        {
          folder: folders[i],
          public_id: names[i],
        }
      );

      secure_url.push(result.secure_url);
    }

    res.json({ secure_url: secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}
