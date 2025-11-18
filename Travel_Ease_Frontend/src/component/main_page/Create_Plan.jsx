import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { create_plan } from "../../utils/travel_plan/create_plan";

function Create_Plan({ on_close }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();
  const [counter, setCounter] = useState(0);
  const [dateRange, setDateRange] = useState([]);
  const [submitted, setSubmitted] = useState({});

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

    if (counter == 1) {
      setValue("start_date", formatDate(0));
      setValue("end_date", formatDate(1));
    }
  }, [dateRange, reset]);

  const handle_back = () => {
    setCounter((prev) => prev - 1);
  };

  const on_submit = async (d) => {
    setSubmitted(d);
    if (counter < 2) {
      setCounter((prev) => prev + 1);
      return;
    } else {
      try {
        console.log(d);
        await create_plan(d);
        setCounter(0);
        on_close();
      } catch (e) {
        console.error({ e });
      }
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <div className="text-center mb-4 text-sm text-gray-500">
          {[0, 1, 2].map((step) => (
            <span
              key={step}
              className={`${
                step === counter ? "text-red-600 font-semibold" : ""
              }`}
            >
              {step + 1}
              {step < 2 && <span className="mx-1">•</span>}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          {counter === 0 && (
            <>
              <h1 className="text-xl font-semibold text-red-600 text-center">
                Travel Plan
              </h1>
              <div>
                <label className="label">Title</label>
                <input
                  {...register("title", {
                    required: "Title is required",
                  })}
                  className="text_box"
                />
                {errors.title && <p>{errors.title.message}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  className="text_box resize-none"
                />
                {errors.description && <p>{errors.description.message}</p>}
              </div>
            </>
          )}

          {counter === 1 && (
            <>
              <h1 className="text-xl font-semibold text-red-600 text-center">
                Travel Details
              </h1>
              <div>
                <label className="label">Location</label>
                <input
                  {...register("location", {
                    required: "Location is required",
                  })}
                  className="text_box"
                />
                {errors.location && <p>{errors.location.message}</p>}
              </div>
              <div>
                <label className="label">Dates</label>
                <div className="flex gap-2">
                  <input
                    {...register("start_date", {
                      required: "Starting Date is required",
                    })}
                    disabled
                    className="text_box w-1/2 bg-gray-100"
                    placeholder="Start date"
                  />
                  <input
                    {...register("end_date", {
                      required: "Ending Date is required",
                    })}
                    disabled
                    className="text_box w-1/2 bg-gray-100"
                    placeholder="End date"
                  />
                </div>
                <Flatpickr
                  options={{
                    dateFormat: "Y-m-d",
                    mode: "multiple",
                  }}
                  value={dateRange}
                  onChange={handle_change}
                  className="text_box mt-2 "
                />
                {(errors.start_date || errors.end_date) && (
                  <p>Starting Date & Ending Date is required</p>
                )}
              </div>
            </>
          )}

          {counter === 2 && (
            <>
              <h1 className="text-xl font-semibold text-red-600 text-center">
                Collaborators
              </h1>
              <div>
                <label className="label">Max Slots</label>
                <input
                  {...register("slots", {
                    required: "Number of Slots is required",
                  })}
                  className="text_box"
                />
                {errors.slots && <p>{errors.slots.message}</p>}
              </div>
              <div>
                <label className="label">Collaborators</label>
                <input
                  {...register("collaborators", {
                    required: "Collaborators are required",
                  })}
                  className="text_box"
                />
                {errors.collaborators && <p>{errors.collaborators.message}</p>}
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={on_close} className="soft_btn">
              Exit
            </button>
            {(counter === 1 || counter === 2) && (
              <button type="button" className="soft_btn" onClick={handle_back}>
                Back
              </button>
            )}
            <button type="submit" className="hard_btn">
              {counter === 2 ? "Submit" : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Create_Plan;
