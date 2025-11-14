import { useForm } from "react-hook-form";
import { upload_image } from "../../utils/business/upload_image";
import Register_Map from "./Register_Map";

function Register({ on_close }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const on_submit = async (data) => {
    // file name, file, folder
    const formData = new FormData();
    formData.append("image", data.picture[0]);
    formData.append("name", data.name);
    formData.append("folder", "Travel_Ease/Business");

    const upload = await upload_image(formData);
    console.log({ upload });

    data.secure_url = upload;
    console.log({ data });
  };

  const handle_close = () => {
    on_close();
  };

  return (
    <div className="modal ">
      <div className="modal_body w-[70vw]">
        <div className="flex gap-6">
          <div className="bg-amber-300 w-[70%]">
            <Register_Map />
          </div>
          <form onSubmit={handleSubmit(on_submit)} className="w-[30%]">
            <h1 className="text-xl font-bold mb-4">you are at register</h1>

            <label className="label">
              Name:
              <input
                {...register("name", {
                  required: "name is required",
                })}
                className="text_box"
              />
            </label>
            {errors.name && <p>{errors.name.message}</p>}
            <label className="label">
              Address:
              <input
                {...register("address", {
                  required: "address is required",
                })}
                className="text_box"
              />
            </label>
            {errors.address && <p>{errors.address.message}</p>}
            <label className="label">
              Description:
              <input
                {...register("description", {
                  required: "description is required",
                })}
                className="text_box"
              />
            </label>
            {errors.description && <p>{errors.description.message}</p>}
            <label className="label">
              Business Hours:
              <input
                {...register("business_hours", {
                  required: "business hours is required",
                })}
                className="text_box"
              />
            </label>
            {errors.business_hours && <p>{errors.business_hours.message}</p>}
            <label className="label">
              Category:
              <input
                {...register("category", {
                  required: "category is required",
                })}
                className="text_box"
              />
            </label>
            {errors.category && <p>{errors.category.message}</p>}
            <label className="label">
              Picture:
              <input
                {...register("picture", {
                  required: "picture is required",
                })}
                className="text_box"
                type="file"
              />
            </label>
            {errors.picture && <p>{errors.picture.message}</p>}
            <div className="w-full flex justify-between mt-4">
              <button className="soft_btn" onClick={handle_close}>
                close
              </button>

              <input type="submit" value="submit" className="hard_btn" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
