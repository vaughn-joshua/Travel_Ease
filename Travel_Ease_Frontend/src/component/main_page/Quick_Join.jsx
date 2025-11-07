import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
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

  const [value, setValue] = useState([]);
  const [option, setOption] = useState("");
  const [enabled, setEnabled] = useState(false);

  const [dateRange, setDateRange] = useState([]);

  const handle_change = (selectedDates, dateStr, instance) => {
    if (selectedDates.length > 2) {
      alert("You can only select up to 2 dates (start and end).");
      const trimmed = selectedDates.slice(0, 2);
      instance.setDate(trimmed, true);
      setDateRange(trimmed);
      return;
    }
    setDateRange(selectedDates);
  };

  useEffect(() => {
    const formatDate = (index) =>
      dateRange[index]?.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    reset({
      start_date: formatDate(0),
      end_date: formatDate(1),
    });
  }, [dateRange, reset]);

  const on_submit = async (data) => {
    const short_date = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString); // convert string to Date object
      return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    };

    data.start_date = short_date(data.start_date);
    data.end_date = short_date(data.end_date);

    const result = await join_plan(data);
    on_close(result);
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Quick Join
        </h1>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          <div>
            <label className="label">Location</label>
            <input
              {...register("location", {
                required: "Location is required",
              })}
              className="text_box"
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Dates</label>
            <div className="flex gap-2">
              <input
                {...register("start_date")}
                readOnly
                className="text_box w-1/2 bg-gray-100"
                placeholder="Start date"
              />
              <input
                {...register("end_date")}
                disabled
                className="text_box w-1/2 bg-gray-100"
                placeholder="End date"
              />
            </div>

            <div>
              <Flatpickr
                options={{
                  dateFormat: "Y-m-d",
                  mode: "multiple",
                }}
                value={dateRange}
                onChange={handle_change}
                className="text_box mt-2"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={on_close} className="soft_btn">
              Exit
            </button>
            <button type="submit" className="hard_btn">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Quick_Join;
