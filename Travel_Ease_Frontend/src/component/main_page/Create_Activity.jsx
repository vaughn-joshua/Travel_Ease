import { create_activity } from "../../utils/travel_plan/create_activity";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useState } from "react";

function Create_Activity({ on_close, business, dates, id }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long", // full name
      day: "numeric",
      year: "numeric",
    });
  };

  const [value, setValue] = useState(dates.start);

  const budget_range = [
    "0-100",
    "100-200",
    "200-400",
    "400-700",
    "700-1000",
    "1000-1500",
    "1500+",
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      target_date: `${formatDate(dates.start)} - ${formatDate(dates.end)}`,
    },
  });

  const handle_change = (selectedDates, instance) => {
    setValue(selectedDates);

    reset({ target_date: formatDate(selectedDates) });
  };

  const on_submit = async (data) => {
    try {
      data.travel_plan_id = id;
      data.user_id = 1; //change it dont hard code the user
      console.log({ data });

      create_activity(data);
      reset();
      on_close();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1>Create Activity</h1>

        <form onSubmit={handleSubmit(on_submit)}>
          <label className="label">
            Title:
            <input
              {...register("title", {
                required: "Please enter a title",
              })}
              className="text_box"
            />
          </label>
          {errors.title && <p>{errors.title.message}</p>}

          <label className="label">
            Notes:
            <input
              {...register("notes", {
                required: "Please enter some notes or description",
              })}
              className="text_box"
            />
          </label>
          {errors.notes && <p>{errors.notes.message}</p>}

          <label className="label">
            Business:
            {/* not required, cuz activity can also just be a sponti one not connected to business */}
            <select {...register("business_id")} className="text_box">
              <option value="">--Select a business--</option>
              {business.map((b) => (
                <option key={b.business_id} value={b.business_id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="label">
            Target Date:
            <input
              {...register("target_date", {
                validate: (value) => {
                  const range = `${formatDate(dates.start)} - ${formatDate(
                    dates.end
                  )}`;
                  return (
                    value !== range || "Please choose a date within the range"
                  );
                },
              })}
              className="text_box"
              disabled
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
          {errors.target_date && <p>{errors.target_date.message}</p>}

          <label className="label">
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
          {errors.budget_range && <p>{errors.budget_range.message}</p>}
          <br />

          <input type="submit" value="Submit" className="hard_btn" />
        </form>

        <button onClick={on_close} className="soft_btn">
          Exit
        </button>
      </div>
    </div>
  );
}

export default Create_Activity;
