export async function upload_images(image) {
  console.log(`you are in frontend upload images`);
  console.log(image);
  try {
    const result = await fetch(
      "http://localhost:3000/api/utils/upload_images",
      {
        method: "POST",
        body: image,
      }
    );

    const data = await result.json();

    return JSON.stringify(data); //get like this const image_urls = JSON.parse(row.image_urls);
  } catch (error) {
    console.log(error);
  }
}
