import { useEffect } from "react";
import { useForm } from "react-hook-form";

function Edit_Plan({ data, on_close }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: data[0].name,
      description: data[0].description,
      location: data[0].location,
      max_slots: data[0].max_slots,
      visibility: data[0].visibility,
    },
  });

  const handle_close = () => {
    on_close();
  };

  const on_submit = (submit_data) => {
    console.log(submit_data);
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="modal">
      <form onSubmit={handleSubmit(on_submit)}>
        <label>
          Name:
          <input {...register("name")} />
        </label>{" "}
        <br />
        <label>
          Dsicription:
          <input {...register("description")} />
        </label>{" "}
        <br />
        <label>
          Visibility:
          <input {...register("visibility")} />
        </label>{" "}
        <br />
        <label>
          Slots:
          <input {...register("max_slots")} />
        </label>{" "}
        <br />
        <label>
          Location:
          <input {...register("location")} />
        </label>{" "}
        <br />
        <label>
          Date:
          <input {...register("date")} />
        </label>{" "}
        <br />
        <input type="submit" value="Save" />
      </form>

      <button onClick={handle_close}>close</button>
    </div>
  );
}

export default Edit_Plan;
