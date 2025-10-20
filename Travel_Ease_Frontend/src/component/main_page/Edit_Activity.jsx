import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { edit_activity } from "../../utils/travel_plan/edit_activity";

function Edit_Activity({ on_close, data }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      notes: data?.notes || "",
      target_date: data?.target_date || "",
      budget_range: data?.budget_range || "",
      is_priority: data?.is_priority || false,
    },
  });

  useEffect(() => {
    // Whenever data changes (like when modal opens with a new activity), reset form values
    reset({
      notes: data?.notes || "",
      target_date: data?.target_date || "",
      budget_range: data?.budget_range || "",
      is_priority: data?.is_priority || false,
    });
  }, [data, reset]);

  const on_submit = async (submit_data) => {
    console.log("submitted");

    // Replace unchanged fields with the original data
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

    console.log("final data to update:", final_data);
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
          <input {...register("notes")} />
        </label>
        <br />

        <label>
          Target Date:
          <input {...register("target_date")} type="date" />
        </label>
        <br />

        <label>
          Budget Range:
          <input {...register("budget_range")} />
        </label>
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
