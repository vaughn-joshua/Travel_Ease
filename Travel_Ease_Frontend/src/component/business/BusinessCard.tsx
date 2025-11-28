import React from "react";
import { Link } from "react-router-dom";

export interface Business {
  id: number;
  name: string;
  description: string | null;
  categories: { id: number; name: string }[];
  hours?: Record<string, { open: string | null; close: string | null }>;
  priceRange: { min: number; max: number } | null;
  media: { cover: string | null; gallery: string[] };
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
  };
  rating: number | null;
  status: boolean;
}

interface BusinessCardProps {
  business: Business;
  className?: string;
  variant?: "default" | "dark";
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  className = "",
  variant = "default",
}) => {
  const isDark = variant === "dark";

  const cardBase =
    "flex h-full flex-col overflow-hidden rounded-3xl border transition duration-300 ease-out";
  const cardStyles = isDark
    ? "border-primary-red/20 bg-white/95 text-gray-900 shadow-lg shadow-primary-red/10 backdrop-blur hover:-translate-y-1 hover:border-primary-red/40"
    : "border-primary-red/10 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl";

  const titleColor = "text-gray-900 group-hover:text-primary-red";
  const bodyColor = "text-gray-600";
  const metaColor = "text-gray-500";

  const formatPriceRange = (range: { min: number; max: number } | null) => {
    if (!range) return null;
    if (range.min === range.max) return `₱${range.min}`;
    return `₱${range.min} - ₱${range.max}`;
  };

  const getPriceIndicator = (range: { min: number; max: number } | null) => {
    if (!range) return null;
    const avg = (range.min + range.max) / 2;
    if (avg < 200) return { label: "Budget", color: "text-green-600" };
    if (avg < 500) return { label: "Mid-range", color: "text-yellow-600" };
    return { label: "Premium", color: "text-primary-red" };
  };

  const priceIndicator = getPriceIndicator(business.priceRange);
  const coverImage = business.media?.cover || 
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";

  return (
    <Link
      to={`/businesses/${business.id}`}
      className={`group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-4 ${
        isDark
          ? "focus-visible:ring-offset-primary-red"
          : "focus-visible:ring-offset-white"
      } ${className}`}
      aria-label={`View ${business.name}`}
    >
      <article className={`${cardBase} ${cardStyles}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={coverImage}
            alt={business.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-70 transition duration-500 group-hover:opacity-80"
            aria-hidden="true"
          />
          {business.categories.length > 0 && (
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                isDark
                  ? "bg-primary-red text-white"
                  : "bg-primary-red/10 text-primary-red"
              }`}
            >
              {business.categories[0].name.replace(/_/g, " ")}
            </span>
          )}
          {business.rating !== null && (
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-sm font-medium text-gray-900 backdrop-blur">
              <svg
                className="h-4 w-4 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{business.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex h-full flex-col gap-4 p-6">
          <div className="space-y-3">
            <h3 className={`text-xl font-semibold leading-tight ${titleColor}`}>
              {business.name}
            </h3>
            {business.description && (
              <p className={`text-sm leading-relaxed line-clamp-2 ${bodyColor}`}>
                {business.description}
              </p>
            )}
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {business.location.address && (
                <div className={`flex items-center gap-1.5 ${metaColor}`}>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate max-w-[150px]">
                    {business.location.address}
                  </span>
                </div>
              )}
              {priceIndicator && (
                <span className={`font-medium ${priceIndicator.color}`}>
                  {priceIndicator.label}
                </span>
              )}
            </div>

            <div
              className={`flex items-center justify-between border-t pt-4 text-sm ${
                isDark ? "border-primary-red/20" : "border-primary-red/10"
              }`}
            >
              {business.priceRange && (
                <span className={metaColor}>
                  {formatPriceRange(business.priceRange)}
                </span>
              )}
              <span className="flex items-center gap-2 font-medium text-primary-red transition group-hover:gap-3">
                View Details
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BusinessCard;
