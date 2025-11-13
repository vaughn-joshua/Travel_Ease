export async function upload_image(image) {
  // const formData = new FormData();
  // formData.append("image", image);
  console.log(`you are in frontend upload image`);
  console.log(image);
  try {
    const result = await fetch("http://localhost:3000/api/utils/upload", {
      method: "POST",
      body: image,
    });

    const data = await result.json();

    return data;
  } catch (error) {
    console.log(error);
  }
}
