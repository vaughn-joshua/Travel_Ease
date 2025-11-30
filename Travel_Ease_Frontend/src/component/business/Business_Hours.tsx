import React, { useState } from "react";

interface HoursEntry {
  open: string | null;
  close: string | null;
}

interface HoursMap {
  [key: string]: HoursEntry;
}

interface BusinessHoursProps {
  onSubmit: (hours: HoursMap) => void;
  onBack: () => void;
  onClose: () => void;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function Business_Hours({
  onSubmit,
  onBack,
  onClose,
}: BusinessHoursProps): React.ReactElement {
  const [hours, setHours] = useState<HoursMap>(() => {
    const initial: HoursMap = {};
    DAYS.forEach((day) => {
      initial[day] = { open: "09:00", close: "17:00" };
    });
    return initial;
  });

  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const handleTimeChange = (
    day: string,
    field: "open" | "close",
    value: string
  ): void => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const toggleClosed = (day: string): void => {
    setClosed((prev) => ({ ...prev, [day]: !prev[day] }));
    if (!closed[day]) {
      setHours((prev) => ({
        ...prev,
        [day]: { open: null, close: null },
      }));
    } else {
      setHours((prev) => ({
        ...prev,
        [day]: { open: "09:00", close: "17:00" },
      }));
    }
  };

  const handleSubmit = (): void => {
    onSubmit(hours);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-red-600 text-center">
        Business Hours
      </h1>

      <div className="space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-4">
            <span className="w-24 capitalize font-medium">{day}</span>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={closed[day] || false}
                onChange={() => toggleClosed(day)}
              />
              <span className="text-sm">Closed</span>
            </label>

            {!closed[day] && (
              <>
                <input
                  type="time"
                  value={hours[day]?.open || "09:00"}
                  onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                  className="text_box w-32"
                />
                <span>to</span>
                <input
                  type="time"
                  value={hours[day]?.close || "17:00"}
                  onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                  className="text_box w-32"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onClose} className="soft_btn">
          Cancel
        </button>
        <button type="button" onClick={onBack} className="soft_btn">
          Back
        </button>
        <button type="button" onClick={handleSubmit} className="hard_btn">
          Next
        </button>
      </div>
    </div>
  );
}

