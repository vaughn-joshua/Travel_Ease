import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { edit_activity } from "../../utils/travel_plan/edit_activity";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

function Edit_Activity({ on_close, data, dates }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long", // full name
      day: "numeric",
      year: "numeric",
    });
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      notes: data.notes,
      target_date: data.target_date,
      budget_range: data.budget_range,
      is_priority: data.is_priority,
    },
  });

  const budget_range = [
    "0-100",
    "100-200",
    "200-400",
    "400-700",
    "700-1000",
    "1000-1500",
    "1500+",
  ];

  const [value, setValue] = useState(dates.start);

  const handle_change = (selectedDates, instance) => {
    setValue(selectedDates);

    reset({ target_date: formatDate(selectedDates) });
  };

  useEffect(() => {
    reset({
      notes: data.notes,
      target_date: data.target_date,
      budget_range: data.budget_range,
      is_priority: data.is_priority,
    });
  }, [data, reset]);

  const on_submit = (submit_data) => {
    console.log(submit_data);

    if (
      submit_data.budget_range == data.budget_range &&
      submit_data.is_priority == data.is_priority &&
      submit_data.notes == data.notes &&
      submit_data.target_date == data.target_date
    ) {
      console.log("nothing edited");
      on_close();
    } else {
      submit_data.activity_id = data.activity_id;
      edit_activity(submit_data);
      on_close();
    }
  };

  return (
    <div className="modal z-10">
      <div className="modal_body">
        <h1>Edit Activity</h1>

        <div className="edit_acitivity_header">
          <small>Business Name: {data.name}</small>
          <p>Address: {data.address}</p>
          <p>Business Hours: {data.business_hours}</p>
          <p>Category: {data.category}</p>
          <p>Rating: {data.rating}</p>
          <p>Contributor: {data.first_name}</p>
        </div>

        <form onSubmit={handleSubmit(on_submit)}>
          <label className="label">
            Notes:
            <input
              {...register("notes", {
                required: "Notes are required.",
              })}
              className="text_box"
            />
          </label>
          {errors.notes && <p className="error">{errors.notes.message}</p>}

          <label className="label">
            Target Date:
            <input
              {...register("target_date", {
                required: "Please select a target date.",
              })}
              className="text_box"
            />
          </label>
          <Flatpickr
            options={{
              dateFormat: "Y-m-d",
              enable: [
                {
                  from: new Date(dates.start).toLocaleDateString("en-CA"), // "YYYY-MM-DD"
                  to: new Date(dates.end).toLocaleDateString("en-CA"),
                },
              ],
            }}
            value={value}
            onChange={handle_change}
            className="text_box"
          />
          {errors.target_date && (
            <p className="error">{errors.target_date.message}</p>
          )}

          <label className="lebel">
            Budget Range:
            <select
              {...register("budget_range", {
                required: "Please select a budget range",
              })}
              className="text_box"
            >
              <option value="">--Select--</option>
              {budget_range.map((range) => (
                <option key={range} value={range}>
                  {range.includes("+")
                    ? `₱${range.replace("+", "+")}`
                    : `₱${range.split("-")[0]} - ₱${range.split("-")[1]}`}
                </option>
              ))}
            </select>
          </label>
          {errors.budget_range && (
            <p className="error">{errors.budget_range.message}</p>
          )}

          <label className="label mt-2">
            Priority:
            <input type="checkbox" {...register("is_priority")} />
          </label>
          <br />

          <input className="hard_btn" type="submit" value="Save" />
        </form>
        <button className="soft_btn" onClick={on_close}>
          Exit
        </button>
      </div>
    </div>
  );
}

export default Edit_Activity;
