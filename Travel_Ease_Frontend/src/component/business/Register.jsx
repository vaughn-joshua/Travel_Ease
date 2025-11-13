import { useForm } from "react-hook-form";
import { upload_image } from "../../utils/business/upload_image";

function Register({ on_close }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const on_submit = (data) => {
    // console.log(data);

    upload_image(data.picture[0]);
  };

  const handle_change = async (data) => {
    console.log(data.target.files[0]);
    const formData = new FormData();
    formData.append("image", data.target.files[0]);
    const upload = await upload_image(formData);
  };

  const handle_close = () => {
    on_close();
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-bold mb-4">you are at register</h1>
        <form onSubmit={handleSubmit(on_submit)}>
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
              onChange={handle_change}
              type="file"
            />
          </label>
          {errors.picture && <p>{errors.picture.message}</p>}
          <input type="submit" value="submit" className="hard_btn" />
        </form>
        <button className="soft_btn" onClick={handle_close}>
          close
        </button>
      </div>
    </div>
  );
}

export default Register;
