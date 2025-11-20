/**
 * Quick_Join Component
 *
 * This modal allows a user to quickly join an existing travel plan
 * by selecting:
 *  - Their preferred location
 *  - A travel start and end date (chosen using Flatpickr)
 *
 * Key Features:
 *  - Uses React Hook Form for input validation and handling
 *  - Uses Flatpickr to allow selecting exactly two dates
 *  - Automatically formats selected dates into display form (Readable)
 *  - Converts dates to "YYYY-MM-DD" format for backend before submitting
 *  - Sends data to join_plan() API helper function
 *
 * Props:
 *  @param {Function} on_close - callback to close modal / return response
 */

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { join_plan } from "../../utils/travel_plan/join_plan";

function Quick_Join({ on_close }) {
  /**
   * React Hook Form initialization:
   *   register  - connects input elements
   *   handleSubmit - validates + handles form submit
   *   reset - allows manually setting field values
   *   errors - contains validation error messages
   */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Additional states kept for possible future expansion (options, toggles, etc.)
  const [value, setValue] = useState([]);
  const [option, setOption] = useState("");
  const [enabled, setEnabled] = useState(false);

  // Stores selected dates from the Flatpickr component
  const [dateRange, setDateRange] = useState([]);

  /**
   * Handles date selection changes from Flatpickr.
   * Ensures that no more than 2 dates are selected (start & end).
   */
  const handle_change = (selectedDates, dateStr, instance) => {
    if (selectedDates.length > 2) {
      alert("You can only select up to 2 dates (start and end).");

      // Keep only first 2 selected dates
      const trimmed = selectedDates.slice(0, 2);

      // Update Flatpickr's UI
      instance.setDate(trimmed, true);

      setDateRange(trimmed);
      return;
    }

    setDateRange(selectedDates);
  };

  /**
   * Updates the form fields (start_date & end_date)
   * when the user selects new dates.
   *
   * Converts Date objects into readable string format:
   *    "Month DD, YYYY"
   */
  useEffect(() => {
    const formatDate = (index) =>
      dateRange[index]?.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    // Reset replaces field values with formatted versions
    reset({
      start_date: formatDate(0),
      end_date: formatDate(1),
    });
  }, [dateRange, reset]);

  /**
   * Submit handler for Quick Join.
   *
   * Steps:
   * 1. Converts formatted date strings into ISO format (YYYY-MM-DD)
   * 2. Calls join_plan() API helper with the form data
   * 3. Sends result back to parent component through on_close()
   */
  const on_submit = async (data) => {
    // Converts readable date -> "YYYY-MM-DD"
    const short_date = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString); // Convert to Date object
      return date.toISOString().split("T")[0]; // Extract YYYY-MM-DD
    };

    data.start_date = short_date(data.start_date);
    data.end_date = short_date(data.end_date);

    // Submit to backend
    const result = await join_plan(data);

    // Pass backend result to parent (e.g., to refresh data or close modal)
    on_close(result);
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <h1 className="text-xl font-semibold text-red-600 text-center mb-4">
          Quick Join
        </h1>

        {/* Form container */}
        <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
          {/* Location field */}
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

          {/* Date range selection */}
          <div>
            <label className="label">Dates</label>

            {/* Preview of selected dates (disabled input fields) */}
            <div className="flex gap-2">
              <input
                {...register("start_date")}
                disabled
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

            {/* Flatpickr calendar widget */}
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

          {/* Buttons Section */}
          <div className="flex justify-end gap-2 pt-4">
            {/* Exit closes modal without submitting */}
            <button type="button" onClick={on_close} className="soft_btn">
              Exit
            </button>

            {/* Submit sends data */}
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
