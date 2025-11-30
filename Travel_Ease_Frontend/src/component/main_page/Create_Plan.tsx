/**
 * Create_Plan Component
 *
 * A 3–step modal form that allows users to create a travel plan.
 */

import { useEffect, useState } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { create_plan } from "../../utils/travel_plan/create_plan";
import type { CreatePlanPayload } from "../../types/travelPlan";
import React from "react";

interface CreatePlanProps {
  on_close: () => void;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  slots?: string;
  collaborators?: string;
}

export default function Create_Plan({ on_close }: CreatePlanProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const [counter, setCounter] = useState<number>(0);
  const [dateRange, setDateRange] = useState<Date[]>([]);

  const handle_change = (
    selectedDates: Date[],
    _dateStr: string,
    instance: { setDate: (dates: Date[], triggerChange: boolean) => void }
  ): void => {
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
    const formatDate = (index: number): string | undefined =>
      dateRange[index]?.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    if (counter === 1) {
      setValue("start_date", formatDate(0) || "");
      setValue("end_date", formatDate(1) || "");
    }
  }, [dateRange, counter, setValue]);

  const handle_back = (): void => {
    setCounter((prev) => prev - 1);
  };

  const on_submit = async (d: FormData): Promise<void> => {
    if (counter < 2) {
      setCounter((prev) => prev + 1);
      return;
    }

    try {
      console.log(d);
      const payload: CreatePlanPayload = {
        title: d.title,
        description: d.description,
        location: d.location,
        start_date: d.start_date,
        end_date: d.end_date,
        slots: d.slots ? parseInt(d.slots, 10) : undefined,
        collaborators: d.collaborators ? parseInt(d.collaborators, 10) : undefined,
      };
      await create_plan(payload);
      setCounter(0);
      on_close();
    } catch (e) {
      console.error({ e });
    }
  };

  const typedErrors = errors as FieldErrors<FormData>;

  return (
    <div className="modal">
      <div className="modal_body">
        <div className="text-center mb-4 text-sm text-gray-500">
          {[0, 1, 2].map((step) => (
            <span
              key={step}
              className={step === counter ? "text-red-600 font-semibold" : ""}
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
                  {...register("title", { required: "Title is required" })}
                  className="text_box"
                />
                {typedErrors.title && (
                  <p className="text-red-500 text-sm">{typedErrors.title.message}</p>
                )}
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  className="text_box resize-none"
                />
                {typedErrors.description && (
                  <p className="text-red-500 text-sm">{typedErrors.description.message}</p>
                )}
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
                {typedErrors.location && (
                  <p className="text-red-500 text-sm">{typedErrors.location.message}</p>
                )}
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
                  className="text_box mt-2"
                />

                {(typedErrors.start_date || typedErrors.end_date) && (
                  <p className="text-red-500 text-sm">Starting Date & Ending Date are required</p>
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
                {typedErrors.slots && (
                  <p className="text-red-500 text-sm">{typedErrors.slots.message}</p>
                )}
              </div>

              <div>
                <label className="label">Collaborators</label>
                <input
                  {...register("collaborators", {
                    required: "Collaborators are required",
                  })}
                  className="text_box"
                />
                {typedErrors.collaborators && (
                  <p className="text-red-500 text-sm">{typedErrors.collaborators.message}</p>
                )}
              </div>
            </>
          )}

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

