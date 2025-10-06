import { useState } from "react";
import { useForm } from "react-hook-form";
import { create_plan } from "../../utils/travel_plan/create_plan";

function Create_Plan() {
  const [counter, setCounter] = useState(1);
  const { register, handleSubmit } = useForm();
  const on_submit = (d) => {
    if (counter === 3) {
      setCounter(1);
      create_plan(d);
    } else {
      setCounter((prev) => prev + 1);
      console.log(d);
    }
  };

  return (
    <form className="modal" onSubmit={handleSubmit(on_submit)}>
      {counter === 1 && (
        <>
          {" "}
          <label>
            Travel Plan Name:
            <input {...register("title")} />
          </label>{" "}
          <br />
          <label>
            Description:
            <input {...register("description")} />
          </label>
        </>
      )}
      {counter === 2 && (
        <>
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
          <label>
            Max Slots:
            <input {...register("slots")} />
          </label>
        </>
      )}
      {counter === 3 && (
        <>
          <label>
            Collaborators:
            <input {...register("collaborators")} />
          </label>
        </>
      )}
      <br />
      <input type="submit" value={counter === 3 ? "submit" : "next"} />
    </form>
  );
}

export default Create_Plan;
