/**
 * Create_Plan Component
 *
 * A 3–step modal form that allows users to create a travel plan.
 *
 * Steps:
 * 1. Travel Plan (title + description)
 * 2. Travel Details (location + date range)
 * 3. Collaborators (slots + collaborators)
 *
 * The form uses:
 *  - React Hook Form for validation and field state
 *  - Flatpickr for selecting a date range
 *  - A step counter to manage which form section is currently displayed
 *
 * Props:
 *  @param {Function} on_close - callback function to close the modal
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { create_plan } from "../../utils/travel_plan/create_plan";

function Create_Plan({ on_close }) {
  // React Hook Form: register inputs, validate, submit, reset form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // Step counter (0 → 1 → 2)
  const [counter, setCounter] = useState(0);

  // Stores selected dates from Flatpickr
  const [dateRange, setDateRange] = useState([]);

  // Stores the values already submitted in previous steps
  const [submitted, setSubmitted] = useState({});

  /**
   * Handle date range selections
   * Flatpickr returns multiple selected dates.
   * Limit: user must select ONLY 2 dates (start & end)
   */
  const handle_change = (selectedDates, dateStr, instance) => {
    if (selectedDates.length > 2) {
      alert("You can only select up to 2 dates (start and end).");

      // Trim extra selections
      const trimmed = selectedDates.slice(0, 2);
      instance.setDate(trimmed, true);
      setDateRange(trimmed);
      return;
    }

    setDateRange(selectedDates);
  };

  /**
   * Whenever dateRange updates, format and bind the values
   * to React Hook Form fields: start_date & end_date
   */
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

  /**
   * Go back one step
   */
  const handle_back = () => {
    setCounter((prev) => prev - 1);
  };

  /**
   * Main form submit handler
   * Handles step progression OR final submission
   */
  const on_submit = async (d) => {
    setSubmitted(d);

    // If not on last step → go to next
    if (counter < 2) {
      setCounter((prev) => prev + 1);
      return;
    }

    // Final step: submit to backend
    try {
      console.log(d);
      await create_plan(d);
      setCounter(0);
      on_close();
    } catch (e) {
      console.error({ e });
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        {/* Step Indicator: 1 • 2 • 3 */}
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

        {/* Multi-step Form */}
        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          {/* STEP 1: Basic Details */}
          {counter === 0 && (
            <>
              <h1 className="text-xl font-semibold text-red-600 text-center">
                Travel Plan
              </h1>

              {/* Title */}
              <div>
                <label className="label">Title</label>
                <input
                  {...register("title", { required: "Title is required" })}
                  className="text_box"
                />
                {errors.title && <p>{errors.title.message}</p>}
              </div>

              {/* Description */}
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

          {/* STEP 2: Travel Details */}
          {counter === 1 && (
            <>
              <h1 className="text-xl font-semibold text-red-600 text-center">
                Travel Details
              </h1>

              {/* Location */}
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

              {/* Date Fields */}
              <div>
                <label className="label">Dates</label>

                {/* Display formatted dates */}
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

                {/* Flatpickr Calendar */}
                <Flatpickr
                  options={{
                    dateFormat: "Y-m-d",
                    mode: "multiple",
                  }}
                  value={dateRange}
                  onChange={handle_change}
                  className="text_box mt-2"
                />

                {(errors.start_date || errors.end_date) && (
                  <p>Starting Date & Ending Date are required</p>
                )}
              </div>
            </>
          )}

          {/* STEP 3: Collaborators */}
          {counter === 2 && (
            <>
              <h1 className="text-xl font-semibold text-red-600 text-center">
                Collaborators
              </h1>

              {/* Max Slots */}
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

              {/* Collaborators */}
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

          {/* Form Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {/* Exit modal */}
            <button type="button" onClick={on_close} className="soft_btn">
              Exit
            </button>

            {/* Back button for step 2 & 3 */}
            {(counter === 1 || counter === 2) && (
              <button type="button" className="soft_btn" onClick={handle_back}>
                Back
              </button>
            )}

            {/* Next or Submit */}
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
