import { useForm, FieldValues } from "react-hook-form";
import RegisterMap from "./RegisterMap";
import { useEffect, useState, ChangeEvent } from "react";

// Predefined category list selection
const category = [
  "food",
  "drinks",
  "accomodation",
  "souvenir shop",
  "nature",
  "night life",
  "leisure",
  "activities",
  "local offers",
];

interface DaySchedule {
  start: string | null;
  end: string | null;
  day: string;
}

// Default operating hour template for each day
const days: DaySchedule[] = [
  { start: null, end: null, day: "sun" },
  { start: null, end: null, day: "mon" },
  { start: null, end: null, day: "tues" },
  { start: null, end: null, day: "wed" },
  { start: null, end: null, day: "thurs" },
  { start: null, end: null, day: "fri" },
  { start: null, end: null, day: "sat" },
];

interface Pin {
  lat: number;
  lon: number;
}

interface RegisterProps {
  on_close: () => void;
}

function Register({ on_close }: RegisterProps) {
  // react-hook-form configuration
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  // Multi-step form counter (0, 1, 2)
  const [counter, setCounter] = useState(0);

  // Map pin coordinates
  const [pin, setPins] = useState<Pin[]>([]);

  // Selected days for business hours
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Final business hours stored after selection
  const [hours, setHours] = useState<DaySchedule[]>([]);

  /**
   * Callback for moving pin on map
   */
  const handlePinMove = (lat: number, lng: number) => {
    setPins([{ lat, lon: lng }]);
    console.log({ lat, lng });
  };

  /**
   * Auto-pin based on street + barangay search
   */
  const set_pin = async () => {
    try {
      const street = getValues("street");
      const brgy = getValues("brgy");

      const response = await fetch("/api/map/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: `${street}, ${brgy}, Tagaytay` }),
      });

      const result = await response.json();

      // Convert API results to map-friendly format
      const cleanPins =
        result?.places?.map((loc: { lat: number; lng: number }) => ({
          lat: Number(loc.lat),
          lon: Number(loc.lng),
        })) || [];

      console.log({ cleanPins });
      setPins(cleanPins);
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Handles final form submission
   */
  const on_submit = async (data: FieldValues) => {
    if (counter == 2) {
      // Build image upload payload
      const formData = new FormData();
      const pictureFiles = data.picture as FileList;
      formData.append("image", pictureFiles[0]);
      formData.append("name", data.name);
      formData.append("folder", "Travel_Ease/Business");

      // Placeholder since upload is disabled temporarily
      data.secure_url = "upload";

      // Store pin coordinates
      data.lat = pin[0].lat;
      data.lng = pin[0].lon;

      // Attach business hours
      data.business_hrs = hours;

      console.log({ data });

      // Submit business to backend
      // await create_business(data);

      on_close();
    } else {
      // Move to next step
      setCounter((prev) => prev + 1);
    }
  };

  /**
   * Fetch real-time address suggestions (optional feature)
   */
  const handle_change = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length >= 3) {
      try {
        const response = await fetch(
          `/api/map/suggestions?query=${encodeURIComponent(value)}`,
          {
            method: "GET",
          },
        );

        await response.json();
        // No handling yet — planned feature
      } catch (error) {
        console.log(error);
      }
    }
  };

  /** Closes modal */
  const handle_close = () => {
    on_close();
  };

  /** Go to previous step */
  const handle_back = () => {
    setCounter((prev) => prev - 1);
  };

  /**
   * Add selected day to chosen day list
   */
  const clicked_day = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev;
      return [...prev, day];
    });
  };

  /**
   * Set start/end time for selected business days
   */
  const change_time = (time: "start" | "end", value: string) => {
    // Loop through selected days & assign time
    selectedDays.forEach((day) => {
      days.forEach((data) => {
        if (data.day == day) {
          if (time === "start") data.start = value;
          if (time === "end") {
            data.end = value;
            setSelectedDays([]); // Clear selection after completing one full time set
          }
        }
      });
    });

    setHours([...days]);
  };

  // Debug: log selected days for development
  useEffect(() => {
    console.log(selectedDays);
  }, [selectedDays]);

  return (
    <div className="modal">
      <div className="modal_body w-[70vw] h-[60vh]">
        <div className="flex gap-6 h-full">
          {/* Map Section */}
          <div
            className="map-side w-[70%] map-container-embedded"
            style={{ height: "400px" }}
          >
            <RegisterMap pins={pin} onPinMove={handlePinMove} />
          </div>

          {/* Form Section */}
          <div className="form-side w-[30%]">
            <div className="flex justify-between">
              <h1 className="text-xl font-bold mb-4">you are at register</h1>

              <button className="soft_btn" onClick={handle_close}>
                X
              </button>
            </div>

            {/* Multi-step Form */}
            <form
              onSubmit={handleSubmit(on_submit)}
              className="flex flex-col h-100"
            >
              {/* Step 0: Basic Information */}
              {counter == 0 && (
                <>
                  <label className="label">
                    Name:
                    <input
                      {...register("name", { required: "name is required" })}
                      className="text_box"
                    />
                  </label>
                  {errors.name && <p>{errors.name.message as string}</p>}

                  <label className="label">
                    Category:
                    <div className="flex flex-wrap gap-2">
                      {category.map((cat, index) => (
                        <div key={index}>
                          <input
                            type="checkbox"
                            value={cat}
                            {...register("category", {
                              required: "category is required",
                            })}
                          />
                          <span>{cat}</span>
                        </div>
                      ))}
                    </div>
                  </label>
                  {errors.category && (
                    <p>{errors.category.message as string}</p>
                  )}

                  <label className="label">
                    Description:
                    <input
                      {...register("description", {
                        required: "description is required",
                      })}
                      className="text_box"
                    />
                  </label>
                  {errors.description && (
                    <p>{errors.description.message as string}</p>
                  )}
                </>
              )}

              {/* Step 1: Address */}
              {counter === 1 && (
                <>
                  <label className="label">
                    House Number:
                    <input
                      {...register("house_no", {
                        required: "House Number is required",
                      })}
                      className="text_box"
                    />
                  </label>
                  {errors.house_no && (
                    <p>{errors.house_no.message as string}</p>
                  )}

                  <label className="label">
                    Street:
                    <input
                      {...register("street", {
                        required: "Street is required",
                      })}
                      className="text_box"
                      onChange={handle_change}
                    />
                  </label>
                  {errors.street && <p>{errors.street.message as string}</p>}

                  <label className="label">
                    Baranggay:
                    <input
                      {...register("brgy", {
                        required: "Barangay is required",
                      })}
                      className="text_box"
                      onChange={handle_change}
                    />
                  </label>
                  {errors.brgy && <p>{errors.brgy.message as string}</p>}

                  <label className="label">
                    City:
                    <input
                      {...register("city", { required: "City is required" })}
                      className="text_box"
                      onChange={set_pin}
                    />
                  </label>
                  {errors.city && <p>{errors.city.message as string}</p>}
                </>
              )}

              {/* Step 2: Business Hours & Picture */}
              {counter === 2 && (
                <>
                  <label className="label">
                    Business Hours:
                    <div className="flex flex-col gap-2">
                      {/* Day Buttons */}
                      <div className="days w-100 mt-2">
                        {days.map((day, index) => (
                          <button
                            className="day_btn"
                            key={index}
                            type="button"
                            onClick={() => clicked_day(day.day)}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>

                      {/* Time Inputs */}
                      {selectedDays.length > 0 && (
                        <div className="flex gap-2">
                          <input
                            {...register("starting_time", {
                              required: "starting_time is required",
                            })}
                            type="time"
                            className="text_box"
                            onChange={(e) =>
                              change_time("start", e.target.value)
                            }
                          />

                          <input
                            {...register("ending_time", {
                              required: "ending_time is required",
                            })}
                            type="time"
                            className="text_box"
                            onChange={(e) => change_time("end", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Error messages */}
                  {errors.starting_time && (
                    <p>{errors.starting_time.message as string}</p>
                  )}
                  {errors.ending_time && (
                    <p>{errors.ending_time.message as string}</p>
                  )}

                  {/* Business Picture */}
                  <label className="label">
                    Picture:
                    <input
                      {...register("picture", {
                        required: "picture is required",
                      })}
                      className="text_box"
                      type="file"
                    />
                  </label>
                  {errors.picture && <p>{errors.picture.message as string}</p>}
                </>
              )}

              {/* Navigation Buttons */}
              <div className="w-full flex justify-between mt-auto">
                {counter > 0 && (
                  <button
                    className="soft_btn"
                    type="button"
                    onClick={handle_back}
                  >
                    back
                  </button>
                )}

                <input
                  type="submit"
                  value={counter == 2 ? "submit" : "next"}
                  className="hard_btn"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
