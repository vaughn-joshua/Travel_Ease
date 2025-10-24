import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { edit_activity } from "../../utils/travel_plan/edit_activity";

function Edit_Activity({ on_close, data, start_date, end_date }) {
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

  useEffect(() => {
    reset({
      notes: data?.notes || "",
      target_date: data?.target_date || "",
      budget_range: data?.budget_range || "",
      is_priority: data?.is_priority || false,
    });
  }, [data, reset]);

  const validateDate = (value) => {
    const normalize = (d) => new Date(d).toISOString().split("T")[0];
    const val = normalize(value);
    const start = normalize(start_date);
    const end = normalize(end_date);

    return val >= start && val <= end
      ? true
      : `Date must be between ${start} and ${end}.`;
  };

  const on_submit = async (submit_data) => {
    const final_data = {
      activity_id: data.activity_id,
      notes: submit_data.notes || data.notes,
      target_date: submit_data.target_date || data.target_date,
      budget_range: submit_data.budget_range || data.budget_range,
      is_priority:
        submit_data.is_priority !== undefined && submit_data.is_priority !== ""
          ? submit_data.is_priority
          : data.is_priority,
    };

    await edit_activity(final_data);
    on_close();
  };

  return (
    <div className="modal">
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
        <label>
          Notes:
          <input
            {...register("notes", {
              required: "Notes are required.",
              maxLength: {
                value: 200,
                message: "Notes cannot exceed 200 characters.",
              },
            })}
          />
        </label>
        {errors.notes && <p className="error">{errors.notes.message}</p>}
        <br />

        <label>
          Target Date:
          <input
            type="date"
            {...register("target_date", {
              required: "Please select a target date.",
              validate: validateDate,
            })}
          />
        </label>
        {errors.target_date && (
          <p className="error">{errors.target_date.message}</p>
        )}
        <br />

        <label>
          Budget Range:
          <select
            {...register("budget_range", {
              required: "Please select a budget range.",
              validate: (value) => {
                const validValues = [
                  "0-100",
                  "100-200",
                  "200-400",
                  "400-700",
                  "700-1000",
                  "1000-1500",
                  "1500+",
                ];
                return validValues.includes(value)
                  ? true
                  : "Invalid budget range.";
              },
            })}
          >
            <option value="">--Select--</option>
            {[
              "0-100",
              "100-200",
              "200-400",
              "400-700",
              "700-1000",
              "1000-1500",
              "1500+",
            ].map((range) => (
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

        <br />

        <label>
          Priority:
          <input type="checkbox" {...register("is_priority")} />
        </label>
        <br />

        <input type="submit" value="Save" />
      </form>
    </div>
  );
}

export default Edit_Activity;
