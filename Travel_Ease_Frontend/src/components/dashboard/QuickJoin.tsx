import { useState } from "react";
import { useForm } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useQuickJoinSearch } from "../../features/travelPlans/mutations";
import type { TravelPlan, QuickJoinPayload } from "../../types/travelPlan";

interface QuickJoinProps {
  on_close: (results: TravelPlan[]) => void;
}

interface FormData {
  start_date: string;
  end_date: string;
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function QuickJoin({ on_close }: QuickJoinProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>();

  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const quickJoinMutation = useQuickJoinSearch();

  const handle_change = (
    selectedDates: Date[],
    _dateStr: string,
    instance: { setDate: (dates: Date[], triggerChange: boolean) => void }
  ): void => {
    if (selectedDates.length > 2) {
      const trimmed = selectedDates.slice(0, 2);
      instance.setDate(trimmed, true);
      setDateRange(trimmed);
      return;
    }
    setDateRange(selectedDates);
    clearErrors(["start_date", "end_date"]);

    if (selectedDates[0]) {
      setValue("start_date", selectedDates[0].toISOString().split("T")[0]);
    } else {
      setValue("start_date", "");
    }
    if (selectedDates[1]) {
      setValue("end_date", selectedDates[1].toISOString().split("T")[0]);
    } else if (selectedDates.length === 1) {
      setValue("end_date", selectedDates[0].toISOString().split("T")[0]);
    } else {
      setValue("end_date", "");
    }
  };

  const on_submit = async (data: FormData): Promise<void> => {
    if (!data.start_date || !data.end_date) {
      setError("start_date", { message: "Please select a complete date range" });
      return;
    }

    setSearchError(null);

    const payload: QuickJoinPayload = {
      location: "Tagaytay Cavite",
      start_date: data.start_date,
      end_date: data.end_date,
    };

    quickJoinMutation.mutate(payload, {
      onSuccess: (results) => {
        if (results.length === 0) {
          setSearchError("No matching plans found for these dates. Try different dates or create your own plan!");
          return;
        }
        on_close(results);
      },
      onError: (error) => {
        console.error("Quick join error:", error);
        setSearchError(error instanceof Error ? error.message : "Failed to search for plans");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-red to-red-600 px-6 py-8 text-white text-center">
          <button
            onClick={() => on_close([])}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-1">Quick Join</h1>
          <p className="text-white/80 text-sm">
            Find public plans that match your travel dates
          </p>
        </div>

        <form onSubmit={handleSubmit(on_submit)} className="p-6 space-y-5">
          {/* Location field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <input
                type="text"
                value="Tagaytay, Cavite"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                readOnly
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                Fixed
              </span>
            </div>
          </div>

          {/* Date range picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When are you traveling?
            </label>
            <Flatpickr
              options={{
                dateFormat: "Y-m-d",
                mode: "range",
                minDate: "today",
              }}
              value={dateRange}
              onChange={handle_change}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-red focus:border-transparent outline-none transition-all cursor-pointer"
              placeholder="Select your travel dates"
            />
            <input type="hidden" {...register("start_date", { required: true })} />
            <input type="hidden" {...register("end_date", { required: true })} />
            
            {/* Selected dates preview */}
            {dateRange.length > 0 && (
              <div className="mt-3 p-4 bg-primary-red/5 rounded-xl border border-primary-red/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-red/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {formatDateDisplay(dateRange[0])}
                      {dateRange.length === 2 && dateRange[1] && (
                        <span className="text-gray-400"> → </span>
                      )}
                      {dateRange.length === 2 && dateRange[1] && formatDateDisplay(dateRange[1])}
                    </p>
                    {dateRange.length === 2 && dateRange[1] && (
                      <p className="text-sm text-gray-500">
                        {Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)) + 1} days trip
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!dateRange.length && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Click above to select your travel dates
              </p>
            )}
            
            {(errors.start_date || errors.end_date) && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.start_date?.message || "Please select a date range"}
              </p>
            )}
          </div>

          {/* Error message */}
          {searchError && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-700 text-sm">{searchError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => on_close([])}
              disabled={quickJoinMutation.isPending}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickJoinMutation.isPending || dateRange.length === 0}
              className="flex-1 px-4 py-3 bg-primary-red text-white rounded-xl hover:bg-primary-red-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {quickJoinMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Plans
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
