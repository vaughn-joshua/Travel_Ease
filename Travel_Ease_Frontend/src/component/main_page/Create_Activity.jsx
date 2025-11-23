import { create_activity } from "../../utils/travel_plan/create_activity";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useState } from "react";
import Search_Box from "../map_components/Search_Box";

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
  const [search_result, set_search_result] = useState(null);

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
      data.lat = search_result[0];
      data.lng = search_result[1];
      data.location = search_result[2];
      data.brgy = search_result[3];
      data.province = search_result[4];
      data.city = search_result[5];

      console.log(data);

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
            Location:
            {/* return the lat lng */}
            <Search_Box onSearch={set_search_result} />
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

          <label className="label">
            Notes:
            <input {...register("notes")} className="text_box" />
          </label>
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
