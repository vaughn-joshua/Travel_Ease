import { useState, useCallback, useRef, useEffect } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function formatPrice(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `₱${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `₱${value}`;
}

export default function PriceRangeSlider({
  min,
  max,
  step = 50,
  value,
  onChange,
}: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const [isDragging, setIsDragging] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isDragging) {
      setLocalMin(value[0]);
      setLocalMax(value[1]);
    }
  }, [value, isDragging]);

  const commitChange = useCallback(
    (nextMin: number, nextMax: number) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange([nextMin, nextMax]);
        setIsDragging(false);
      }, 200);
    },
    [onChange],
  );

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDragging(true);
    const v = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(v);
    commitChange(v, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDragging(true);
    const v = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(v);
    commitChange(localMin, v);
  };

  const pctMin = ((localMin - min) / (max - min)) * 100;
  const pctMax = ((localMax - min) / (max - min)) * 100;

  const isFullRange = localMin === min && localMax === max;

  return (
    <div className="space-y-4">
      {/* Value labels */}
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-gray-700">
          {formatPrice(localMin)}
        </span>
        <span className="mx-2 text-xs text-gray-400">&ndash;</span>
        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-gray-700">
          {formatPrice(localMax)}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-6 w-full touch-none">
        {/* Background track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-200" />

        {/* Active range fill */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary-red transition-[left,right] duration-75"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          aria-label="Minimum price"
          className="pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-red [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-125 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-20 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-red [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          aria-label="Maximum price"
          className="pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-red [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-125 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-30 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-red [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
        />
      </div>

      {/* Tick labels */}
      <div className="flex justify-between px-0.5 text-[10px] text-gray-400">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}</span>
      </div>

      {/* Reset link */}
      {!isFullRange && (
        <button
          type="button"
          onClick={() => onChange([min, max])}
          className="text-xs font-medium text-primary-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red rounded"
        >
          Reset price range
        </button>
      )}
    </div>
  );
}
