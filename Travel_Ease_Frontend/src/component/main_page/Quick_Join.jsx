import { useForm } from "react-hook-form";
import { useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { join_plan } from "../../utils/travel_plan/join_plan";

function Quick_Join({ on_close }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [value, setValue] = useState(Date);
  const [option, setOption] = useState("");
  const [enabled, setEnabled] = useState(false);

  const on_change = (selectedDates, dateStr, instance) => {
    const formatted =
      instance.config.mode === "multiple" ? dateStr.split(", ") : [dateStr];

    setValue(formatted);
    reset({ date: formatted });
  };

  const handle_change = (value) => {
    setOption(value);
    setEnabled((prev) => !prev);
  };

  const on_submit = async (data) => {
    const result = await join_plan(data);
    on_close(result);
  };

  return (
    <div className="modal">
      <h1>join</h1>
      <form onSubmit={handleSubmit(on_submit)}>
        <label>
          Location:
          <input
            {...register("location", {
              required: "Location is required",
            })}
          />
        </label>
        {errors.location && <p>{errors.location.message}</p>}
        <br />
        <label>
          Choose
          <select
            {...register("option")}
            onChange={(e) => handle_change(e.target.value)}
          >
            <option>--select--</option>
            <option value="specific">specifc</option>
            <option value="range">range</option>
          </select>
        </label>{" "}
        <br />
        <label>
          Date:
          <input {...register("date")} placeholder="choose first" readOnly />
        </label>
        {enabled && (
          <>
            <Flatpickr
              options={{
                dateFormat: "Y-m-d",
                mode: option === "range" ? "multiple" : "single",
              }}
              value={value}
              onChange={on_change}
            />
          </>
        )}
        <br />
        <button>submit</button>
      </form>
      <button onClick={on_close}>exit</button>
    </div>
  );
}

export default Quick_Join;
