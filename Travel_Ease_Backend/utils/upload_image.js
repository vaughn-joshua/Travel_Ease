export async function upload_image(req, res) {
  try {
    console.log("you are at upload image");
    console.log("File info:", req.file); // ✅ This will no longer be empty
    res.json({ message: "Image received successfully", file: req.file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}
