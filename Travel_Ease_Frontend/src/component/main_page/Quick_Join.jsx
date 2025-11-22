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
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 lg:p-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Quick Join</h1>
          <p className="text-xs sm:text-sm text-gray-600">Find travel plans matching your preferences</p>
        </div>

        <form onSubmit={handleSubmit(on_submit)} className="space-y-4 sm:space-y-5">
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
                {...register("start_date")}
                disabled
                className="flex-1 border-2 border-gray-300 rounded-lg px-2 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-600 cursor-not-allowed text-xs sm:text-sm min-h-[44px]"
                placeholder="Start date"
              />
              <input
                {...register("end_date")}
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
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={on_close} 
              className="px-4 sm:px-5 py-2.5 border-2 border-gray-300 text-gray-700 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 min-h-[44px] order-2 sm:order-1"
            >
              Exit
            </button>
            <button 
              type="submit" 
              className="px-5 sm:px-6 py-2.5 bg-[#E10600] text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-[#B80500] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E10600] focus:ring-offset-2 shadow-md hover:shadow-lg min-h-[44px] order-1 sm:order-2"
            >
              Find Plans
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Quick_Join;
