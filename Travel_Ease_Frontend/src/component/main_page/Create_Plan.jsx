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
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 lg:p-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Progress Indicator */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`flex-1 h-1 rounded-full ${
                  step <= counter ? "bg-[#E10600]" : "bg-gray-200"
                }`}></div>
                {step < 2 && <div className="w-1 sm:w-2"></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-semibold text-gray-600">
            <span className={counter >= 0 ? "text-[#E10600]" : ""}>Plan Info</span>
            <span className={counter >= 1 ? "text-[#E10600]" : ""}>Details</span>
            <span className={counter >= 2 ? "text-[#E10600]" : ""}>Collaborators</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4 sm:space-y-5">
          {counter === 0 && (
            <>
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Create Travel Plan</h1>
                <p className="text-xs sm:text-sm text-gray-600">Let's start with the basics</p>
              </div>
              <div>
                <label className="label text-gray-700 font-semibold text-sm sm:text-base">Plan Title</label>
                <input
                  {...register("title", {
                    required: "Title is required",
                  })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#E10600] focus:border-[#E10600] focus:outline-none transition-colors min-h-[44px]"
                  placeholder="e.g., Summer Trip to Europe"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label text-gray-700 font-semibold text-sm sm:text-base">Description</label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  rows={4}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#E10600] focus:border-[#E10600] focus:outline-none transition-colors resize-none"
                  placeholder="Tell us about your travel plan..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description.message}
                  </p>
                )}
              </div>
            </>
          )}

          {counter === 1 && (
            <>
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Travel Details</h1>
                <p className="text-xs sm:text-sm text-gray-600">Where and when are you going?</p>
              </div>
              <div>
                <label className="label text-gray-700 font-semibold text-sm sm:text-base">Location</label>
                <input
                  {...register("location", {
                    required: "Location is required",
                  })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#E10600] focus:border-[#E10600] focus:outline-none transition-colors min-h-[44px]"
                  placeholder="e.g., Paris, France"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.location.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label text-gray-700 font-semibold text-sm sm:text-base">Travel Dates</label>
                <div className="flex gap-2 sm:gap-3 mb-3">
                  <input
                    {...register("start_date", {
                      required: "Starting Date is required",
                    })}
                    disabled
                    className="flex-1 border-2 border-gray-300 rounded-lg px-2 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-600 cursor-not-allowed text-xs sm:text-sm min-h-[44px]"
                    placeholder="Start date"
                  />
                  <input
                    {...register("end_date", {
                      required: "Ending Date is required",
                    })}
                    disabled
                    className="flex-1 border-2 border-gray-300 rounded-lg px-2 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-600 cursor-not-allowed text-xs sm:text-sm min-h-[44px]"
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
                  className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#E10600] focus:border-[#E10600] focus:outline-none transition-colors min-h-[44px]"
                />
                {(errors.start_date || errors.end_date) && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Starting Date & Ending Date is required
                  </p>
                )}
              </div>
            </>
          )}

          {counter === 2 && (
            <>
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Collaborators</h1>
                <p className="text-xs sm:text-sm text-gray-600">Who's joining you?</p>
              </div>
              <div>
                <label className="label text-gray-700 font-semibold text-sm sm:text-base">Max Slots</label>
                <input
                  type="number"
                  {...register("slots", {
                    required: "Number of Slots is required",
                  })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#E10600] focus:border-[#E10600] focus:outline-none transition-colors min-h-[44px]"
                  placeholder="e.g., 4"
                  min="1"
                />
                {errors.slots && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.slots.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label text-gray-700 font-semibold text-sm sm:text-base">Collaborators</label>
                <input
                  {...register("collaborators", {
                    required: "Collaborators are required",
                  })}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#E10600] focus:border-[#E10600] focus:outline-none transition-colors min-h-[44px]"
                  placeholder="Enter collaborator emails (comma separated)"
                />
                {errors.collaborators && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.collaborators.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={on_close} 
              className="px-4 sm:px-5 py-2.5 border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 min-h-[44px] order-3 sm:order-1"
            >
              Exit
            </button>
            {(counter === 1 || counter === 2) && (
              <button 
                type="button" 
                className="px-4 sm:px-5 py-2.5 border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 min-h-[44px] order-2" 
                onClick={handle_back}
              >
                ← Back
              </button>
            )}
            <button 
              type="submit" 
              className="px-5 sm:px-6 py-2.5 bg-[#E10600] text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 shadow-md hover:shadow-lg min-h-[44px] order-1 sm:order-3"
            >
              {counter === 2 ? "Create Plan" : "Next →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Create_Plan;
