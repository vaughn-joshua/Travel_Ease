import { useState } from "react";
import { useForm } from "react-hook-form";
import Business_Hours from "./Business_Hours";
import Register_Map from "./Register_Map";
import { create_business } from "../../utils/business/create_business";
import type { BusinessHoursMap } from "../../types/business";

interface RegisterProps {
  on_close: () => void;
}

interface FormData {
  name: string;
  description: string;
  categories: string;
  house_number: string;
  street: string;
  brgy: string;
  city: string;
}

interface LocationData {
  lat: number;
  lng: number;
}

export default function Register({ on_close }: RegisterProps): React.ReactElement {
  const [step, setStep] = useState<number>(0);
  const [hours, setHours] = useState<BusinessHoursMap>({});
  const [location, setLocation] = useState<LocationData | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const nextStep = (): void => {
    setStep((prev) => prev + 1);
  };

  const prevStep = (): void => {
    setStep((prev) => prev - 1);
  };

  const handleHoursSubmit = (hoursData: BusinessHoursMap): void => {
    setHours(hoursData);
    nextStep();
  };

  const handleLocationSubmit = (locationData: LocationData): void => {
    setLocation(locationData);
    submitForm();
  };

  const on_submit = async (data: FormData): Promise<void> => {
    setFormData(data);
    nextStep();
  };

  const submitForm = async (): Promise<void> => {
    if (!formData || !location) return;

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        categoryIds: formData.categories.split(",").map((c) => parseInt(c.trim())),
        hours,
        lat: location.lat,
        lng: location.lng,
        address: `${formData.house_number} ${formData.street}, ${formData.brgy}, ${formData.city}`,
      };

      await create_business(payload);
      on_close();
    } catch (e) {
      console.error("Error creating business:", e);
    }
  };

  return (
    <div className="modal">
      <div className="modal_body">
        <div className="text-center mb-4 text-sm text-gray-500">
          {[0, 1, 2].map((s) => (
            <span
              key={s}
              className={s === step ? "text-red-600 font-semibold" : ""}
            >
              {s + 1}
              {s < 2 && <span className="mx-1">•</span>}
            </span>
          ))}
        </div>

        {step === 0 && (
          <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
            <h1 className="text-xl font-semibold text-red-600 text-center">
              Business Information
            </h1>

            <div>
              <label className="label">Business Name</label>
              <input
                {...register("name", { required: "Business name is required" })}
                className="text_box"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                {...register("description")}
                className="text_box resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Categories (comma-separated IDs)</label>
              <input
                {...register("categories", { required: "Categories required" })}
                className="text_box"
                placeholder="1, 2, 3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">House/Building Number</label>
                <input {...register("house_number")} className="text_box" />
              </div>
              <div>
                <label className="label">Street</label>
                <input {...register("street")} className="text_box" />
              </div>
              <div>
                <label className="label">Barangay</label>
                <input {...register("brgy")} className="text_box" />
              </div>
              <div>
                <label className="label">City</label>
                <input {...register("city")} className="text_box" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={on_close} className="soft_btn">
                Cancel
              </button>
              <button type="submit" className="hard_btn">
                Next
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <Business_Hours
            onSubmit={handleHoursSubmit}
            onBack={prevStep}
            onClose={on_close}
          />
        )}

        {step === 2 && (
          <Register_Map
            onSubmit={handleLocationSubmit}
            onBack={prevStep}
            onClose={on_close}
          />
        )}
      </div>
    </div>
  );
}

