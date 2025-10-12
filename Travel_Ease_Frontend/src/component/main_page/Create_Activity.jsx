import { useForm } from "react-hook-form";
import { create_activity } from "../../utils/travel_plan/create_activity";

function Create_Activity({ id, business }) {
  const { register, handleSubmit, reset } = useForm();

  const on_submit = async (data) => {
    try {
      // ADD "id" to data
      data.travel_plan_id = id;
      data.business_id = 1; //remove if available na yung business.id
      create_activity(data);
      reset();
    } catch (e) {
      console.log({ e });
    }
  };

  return (
    <div className="modal">
      <h1>create activity</h1>
      <form onSubmit={handleSubmit(on_submit)}>
        {/* name, location, notes, target date, budget_range, priority */}
        <label>
          Name:
          <input {...register("name")} />
        </label>{" "}
        <br />
        <label>
          Notes:
          <input {...register("notes")} />
        </label>{" "}
        <br />
        <label>
          Business:
          <select id="cars">
            {business.map((b) => {
              return (
                <option key={b.business_id} value={b.business_id}>
                  {b.name}
                </option>
              );
            })}
          </select>
        </label>{" "}
        <br />
        <label>
          Target Date:
          <input {...register("target_date")} />
        </label>{" "}
        <br />
        <label>
          Budget Range:
          <input {...register("budget_range")} />
        </label>{" "}
        <br />
        <input type="submit" value="submit" />
      </form>
    </div>
  );
}

export default Create_Activity;
