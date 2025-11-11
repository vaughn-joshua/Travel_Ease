export async function upload_image(image) {
  const formData = new FormData();
  formData.append("image", image);
  try {
    console.log({ message: "front end image", image });
    const result = await fetch("http://localhost:3000/api/utils/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: formData,
    });

    const data = await result.json();

    console.log(data);
  } catch (error) {
    console.log(error);
  }
}
