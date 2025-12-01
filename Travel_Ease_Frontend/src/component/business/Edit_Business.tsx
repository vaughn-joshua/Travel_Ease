import { useForm, FieldValues } from "react-hook-form";
import Register_Map from "./Register_Map";
import { useEffect, useState, ChangeEvent } from "react";
import { business_edit } from "../../utils/business/business_edit";

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

interface BusinessCategory {
  category_id: number;
  category_name: string;
  price_range?: {
    min_price: number;
    max_price: number;
  };
}

interface BusinessHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

interface Business {
  id: number | string;
  name: string;
  description: string;
  street: string;
  brgy: string;
  city: string;
  house_number: string;
  categories: BusinessCategory[];
  business_hours: BusinessHour[];
}

interface EditBusinessProps {
  on_close: () => void;
  business: Business;
}

function Edit_Business({ on_close, business }: EditBusinessProps) {
  // react-hook-form configuration
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm();

  const selectedCategories = watch("category") || [];

  // Multi-step form counter (0, 1, 2)
  const [counter, setCounter] = useState(0);

  // Map pin coordinates
  const [pin, setPins] = useState<Pin[]>([]);

  // Selected days for business hours
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Final business hours stored after selection
  const [, setHours] = useState<DaySchedule[]>([]);

  /**
   * Callback for moving pin on map
   */
  const handlePinMove = (lat: number, lng: number) => {
    setPins([{ lat, lon: lng }]);
    console.log({ lat, lng });
  };

  useEffect(() => {
    const load_pin = async () => {
      try {
        const street = business.street;
        const brgy = business.brgy;

        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ street, brgy }),
        });

        const result = await response.json();

        // Convert API results to map-friendly format
        const cleanPins = result?.map((loc: { lat: string | number; lon: string | number }) => ({
          lat: Number(loc.lat),
          lon: Number(loc.lon),
        }));

        console.log({ cleanPins });
        setPins(cleanPins);
      } catch (error) {
        console.log(error);
      }
    };
    load_pin();
  }, [business.street, business.brgy]);

  /**
   * Auto-pin based on street + barangay search
   */
  const set_pin = async () => {
    try {
      const street = getValues("street");
      const brgy = getValues("brgy");

      const response = await fetch("http://localhost:3000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ street, brgy }),
      });

      const result = await response.json();

      // Convert API results to map-friendly format
      const cleanPins = result.map((loc: { lat: string | number; lon: string | number }) => ({
        lat: Number(loc.lat),
        lon: Number(loc.lon),
      }));

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
    if (counter == 3) {
      // Build image upload payload
      const formData = new FormData();
      const pictureFiles = data.picture as FileList;
      if (pictureFiles?.[0]) {
        formData.append("image", pictureFiles[0]);
        formData.append("name", data.name);
        formData.append("folder", "Travel_Ease/Business");
      }

      // Placeholder since upload is disabled temporarily
      data.secure_url = "upload";

      // Store pin coordinates
      data.lat = pin[0].lat;
      data.lng = pin[0].lon;

      console.log({ data });

      // Submit business to backend
      await business_edit(data as any, String(business.id));

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
        const response = await fetch("/api/suggestions", {
          method: "GET",
        });

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

  // Suppress unused variable warning
  void clicked_day;
  void change_time;

  return (
    <div className="modal">
      <div className="modal_body w-[70vw] h-[60vh]">
        <div className="flex gap-6 h-full">
          {/* Map Section */}
          <div className="map-side w-[70%]">
            <Register_Map pins={pin} onPinMove={handlePinMove} />
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
                      defaultValue={business.name}
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
                            defaultChecked={business.categories?.some(
                              (c) => c.category_name === cat
                            )}
                            {...register("category", {
                              required: "category is required",
                            })}
                          />
                          <span>{cat}</span>
                        </div>
                      ))}
                    </div>
                  </label>
                  {errors.category && <p>{errors.category.message as string}</p>}

                  <label className="label">
                    Description:
                    <input
                      {...register("description", {
                        required: "description is required",
                      })}
                      className="text_box"
                      defaultValue={business.description}
                    />
                  </label>
                  {errors.description && <p>{errors.description.message as string}</p>}
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
                      defaultValue={business.house_number}
                    />
                  </label>
                  {errors.house_no && <p>{errors.house_no.message as string}</p>}

                  <label className="label">
                    Street:
                    <input
                      {...register("street", {
                        required: "Street is required",
                      })}
                      className="text_box"
                      onChange={handle_change}
                      defaultValue={business.street}
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
                      defaultValue={business.brgy}
                    />
                  </label>
                  {errors.brgy && <p>{errors.brgy.message as string}</p>}

                  <label className="label">
                    City:
                    <input
                      {...register("city", { required: "City is required" })}
                      className="text_box"
                      onChange={set_pin}
                      defaultValue={business.city}
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
                    {business.business_hours.map((hour, index) => (
                      <div key={index} className="flex gap-1">
                        <p>{hour.day_of_week} :</p>
                        <input
                          {...register(`business_hrs.${index}.open_time`)}
                          className="text_box"
                          defaultValue={hour.open_time}
                        />
                        <input
                          {...register(`business_hrs.${index}.close_time`)}
                          className="text_box"
                          defaultValue={hour.close_time}
                        />
                        <input
                          {...register(`business_hrs.${index}.day_of_week`)}
                          value={hour.day_of_week}
                          hidden
                          readOnly
                        />
                      </div>
                    ))}
                  </label>

                  {/* Business Picture */}
                  <label className="label">
                    Picture:
                    <input
                      {...register("picture")}
                      className="text_box"
                      type="file"
                    />
                  </label>
                  {errors.picture && <p>{errors.picture.message as string}</p>}
                </>
              )}

              {counter === 3 && (
                <>
                  {(selectedCategories as string[]).map((cat: string, index: number) => {
                    // Find matching existing category
                    const existing = business.categories.find(
                      (c) => c.category_name === cat
                    );

                    return (
                      <div key={index}>
                        <label className="label">
                          {cat} Price Range:
                          <div className="flex gap-3">
                            <input
                              {...register(`categories.${index}.min_price`, {
                                min: 1,
                              })}
                              className="text_box"
                              type="number"
                              defaultValue={
                                business.categories[index]?.price_range?.min_price
                              }
                            />
                            <input
                              {...register(`categories.${index}.max_price`, {
                                min: 1,
                              })}
                              className="text_box"
                              type="number"
                              defaultValue={
                                business.categories[index]?.price_range?.max_price
                              }
                            />
                            <input
                              type="hidden"
                              {...register(`categories.${index}.category_name`)}
                              value={cat}
                            />

                            {/* existing category? give its id, else null */}
                            <input
                              type="hidden"
                              {...register(`categories.${index}.category_id`)}
                              value={existing?.category_id || ""}
                            />
                          </div>
                        </label>
                        {errors.category && <p>{(errors.category as any).message}</p>}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Navigation Buttons */}
              <div className="w-full flex justify-between mt-auto">
                {counter > 0 && (
                  <button className="soft_btn" type="button" onClick={handle_back}>
                    back
                  </button>
                )}

                <input
                  type="submit"
                  value={counter == 3 ? "submit" : "next"}
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

export default Edit_Business;
