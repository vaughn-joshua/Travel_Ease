import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useState } from "react";
import { edit_plan } from "../../utils/travel_plan/edit_plan";

function Edit_Plan({ data, on_close, travel_plan }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: data[0].name,
      description: data[0].description,
      location: data[0].location,
      max_slots: data[0].max_slots,
      visibility: data[0].visibility,
      start_date: data[0].start_date,
      end_date: data[0].end_date,
    },
  });

  const [dateRange, setDateRange] = useState([]);

  const handle_change = (selectedDates, instance) => {
    console.log(selectedDates);
    if (selectedDates.length > 2) {
      selectedDates.splice(2);
      instance.setDate(selectedDates);
    }

    setDateRange([...selectedDates]);
  };

  useEffect(() => {
    console.log(data);
    const formatDate = (number) => {
      return (
        dateRange[number] &&
        dateRange[number].toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    reset({
      start_date: formatDate(0),
      end_date: formatDate(1),
    });
  }, [dateRange]);

  const handle_close = () => {
    on_close();
  };

  const on_submit = (submit_data) => {
    submit_data.travel_plan = travel_plan;
    edit_plan(submit_data);
    on_close();
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="modal">
      <h1>Edit Plan</h1>
      <form onSubmit={handleSubmit(on_submit)}>
        <label>
          Name:
          <input
            {...register("name", {
              required: "Name is Required",
            })}
          />
        </label>
        {errors.name && <p>{errors.name.message}</p>}
        <br />
        <label>
          Dsicription:
          <input
            {...register("description", {
              required: "Description is required.",
            })}
          />
        </label>
        {errors.description && <p>{errors.description.message}</p>}
        <br />
        <label>
          Visibility:
          <input type="checkbox" {...register("visibility")} />
        </label>
        {errors.visibility && <p>{errors.visibility.message}</p>}
        <br />
        <label>
          Slots:
          <input
            {...register("max_slots", {
              required: "Slots is Required",
            })}
          />
        </label>
        {errors.max_slots && <p>{errors.max_slots.message}</p>}
        <br />
        <label>
          Location:
          <input
            {...register("location", {
              required: "Location is Required",
            })}
          />
        </label>
        {errors.location && <p>{errors.location.message}</p>}
        <br />
        <label>
          Dates:
          <input {...register("start_date")} readOnly />
          <input {...register("end_date")} disabled />
        </label>
        <br />
        <Flatpickr
          options={{
            mode: "multiple",
            dateFormat: "Y-m-d",
          }}
          value={dateRange}
          onChange={handle_change}
        />{" "}
        <br />
        <input type="submit" value="Save" />
      </form>

      <button onClick={handle_close}>close</button>
    </div>
  );
}

export default Edit_Plan;
