import { useState } from "react";
import { useForm } from "react-hook-form";
import { create_plan } from "../../utils/travel_plan/create_plan";

function Create_Plan({ on_close }) {
  const [counter, setCounter] = useState(1);
  const { register, handleSubmit, reset } = useForm();

  const on_submit = async (d) => {
    if (counter < 3) {
      setCounter((prev) => prev + 1);
      return;
    }

    try {
      await create_plan(d);
      reset();
      setCounter(1);
      on_close();
    } catch (e) {
      console.error({ e });
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit(on_submit)}>
        {counter === 1 && (
          <>
            {" "}
            <h1>Travel Plan</h1>
            <label>
              Title:
              <input {...register("title")} />
            </label>{" "}
            <br />
            <label>
              Description:
              <textarea {...register("description")} />
            </label>
          </>
        )}
        {counter === 2 && (
          <>
            <h1>Travel Plan</h1>
            <label>
              Location:
              <input {...register("location")} />
            </label>{" "}
            <br />
            <label>
              Date:
              <input {...register("date")} type="date" />
            </label>{" "}
            <br />
            <label>
              End Date:
              <input {...register("end_date")} type="date" />
            </label>
          </>
        )}
        {counter === 3 && (
          <>
            <h1>Collaborators</h1>
            <label>
              Max Slots:
              <input {...register("slots")} />
            </label>{" "}
            <br />
            <label>
              Collaborators:
              <input {...register("collaborators")} />
            </label>
          </>
        )}
        <br />
        <input type="submit" value={counter === 3 ? "submit" : "next"} />
      </form>
      <button onClick={on_close}>Exit</button>
    </div>
  );
}

export default Create_Plan;
