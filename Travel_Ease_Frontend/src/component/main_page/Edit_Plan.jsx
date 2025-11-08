import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useState } from "react";
import { edit_plan } from "../../utils/travel_plan/edit_plan";
import { edit_activity_date } from "../../utils/travel_plan/edit_activity_date";

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
    if (selectedDates.length > 2) {
      selectedDates.splice(2);
      instance.setDate(selectedDates);
    }

    setDateRange([...selectedDates]);
  };

  useEffect(() => {
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

  const calculate_change = (day, origin) => {
    if (day !== origin) {
      const old_date = new Date(origin);
      const new_date = new Date(day);

      // Normalize both to midnight to ignore time differences
      old_date.setHours(0, 0, 0, 0);
      new_date.setHours(0, 0, 0, 0);

      const added_date = new_date - old_date;

      return added_date;
    } else {
      return 0;
    }
  };

  const on_submit = (submit_data) => {
    const start_change = calculate_change(
      submit_data.start_date,
      data[0].start_date
    );
    const end_change = calculate_change(submit_data.end_date, data[0].end_date);

    const edit_activity_data = {
      start: start_change,
      end: end_change,
      id: travel_plan,
    };

    submit_data.travel_plan = travel_plan;
    edit_plan(submit_data);
    edit_activity_date(edit_activity_data);
    on_close();
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="modal">
      <div className="modal_body">
        <h1>Edit Plan</h1>
        <form onSubmit={handleSubmit(on_submit)}>
          <label className="label">
            Name:
            <input {...register("name", {})} className="text_box" />
          </label>
          {errors.name && <p>{errors.name.message}</p>}
          <label className="label">
            Dsicription:
            <input {...register("description", {})} className="text_box" />
          </label>
          {errors.description && <p>{errors.description.message}</p>}
          <label className="label mt-4">
            Visibility:
            <input type="checkbox" {...register("visibility")} />
          </label>
          {errors.visibility && <p>{errors.visibility.message}</p>}
          <label className="label">
            Slots:
            <input {...register("max_slots")} className="text_box" />
          </label>
          {errors.max_slots && <p>{errors.max_slots.message}</p>}
          <label className="label ">Dates:</label>
          <div className="flex">
            {" "}
            <input
              {...register("start_date")}
              className="text_box w-1/2 bg-gray-100"
              disabled
            />
            <input
              {...register("end_date")}
              className="text_box w-1/2 bg-gray-100"
              disabled
            />
          </div>
          <Flatpickr
            options={{
              mode: "multiple",
              dateFormat: "Y-m-d",
            }}
            value={dateRange}
            onChange={handle_change}
            className="text_box"
          />{" "}
          <br />
          <input type="submit" value="Save" className="hard_btn mt-4" />
        </form>
        <button className="soft_btn" onClick={handle_close}>
          close
        </button>
      </div>
    </div>
  );
}

export default Edit_Plan;
