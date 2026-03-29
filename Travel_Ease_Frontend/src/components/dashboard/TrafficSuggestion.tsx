import React from "react";
import { useTrafficSuggestion } from "../../features/travelPlans/queries";
import { AlertTriangle, Clock, MapPin, CheckCircle2 } from "lucide-react";

interface TrafficSuggestionProps {
  originId: number | null;
  destId: number;
  dayGroup?: "weekday" | "weekend";
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  onShowAlternatives: (alternatives: any[], triggeringDestId: number) => void;
}

const estimateTrafficLevel = (
  etaMinutes: number,
): "LIGHT" | "MODERATE" | "HEAVY" => {
  if (etaMinutes > 30) return "HEAVY";
  if (etaMinutes > 15) return "MODERATE";
  return "LIGHT";
};

const distanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function TrafficSuggestion({
  originId,
  destId,
  dayGroup = "weekday",
  originLat,
  originLng,
  destLat,
  destLng,
  onShowAlternatives,
}: TrafficSuggestionProps) {
  const { data, isLoading } = useTrafficSuggestion(
    originId,
    destId,
    dayGroup,
    originLat,
    originLng,
  );

  const fallbackEta = React.useMemo(() => {
    if (
      originLat === undefined ||
      originLng === undefined ||
      destLat === undefined ||
      destLng === undefined
    ) {
      return null;
    }

    const km = distanceKm(originLat, originLng, destLat, destLng);
    const averageSpeedKmh = dayGroup === "weekend" ? 18 : 22;
    const eta = Math.round((km / averageSpeedKmh) * 60);
    return Math.max(3, eta);
  }, [originLat, originLng, destLat, destLng, dayGroup]);

  if (isLoading) {
    return (
      <span className="flex w-full max-w-full items-start gap-1 px-2.5 py-1 text-[11px] font-medium bg-gray-50 text-gray-500 rounded-lg border border-gray-200 animate-pulse whitespace-normal break-words leading-tight">
        <Clock className="w-3 h-3 shrink-0 mt-0.5" />
        Calculating...
      </span>
    );
  }

  const hasLiveTraffic = Boolean(
    data?.trafficLevel && data.trafficLevel !== "UNKNOWN",
  );
  const eta = Math.round(data?.eta || fallbackEta || 0);

  if (!hasLiveTraffic && !fallbackEta) {
    return (
      <span className="flex w-full max-w-full items-start gap-1 px-2.5 py-1 text-[11px] font-medium bg-gray-50 text-gray-500 rounded-lg border border-gray-200 whitespace-normal break-words leading-tight">
        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
        Traffic N/A
      </span>
    );
  }

  const level = hasLiveTraffic
    ? data!.trafficLevel!
    : estimateTrafficLevel(eta);

  if (level === "LIGHT") {
    return (
      <span className="flex w-full max-w-full items-start gap-1 px-2.5 py-1 text-[11px] font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 whitespace-normal break-words leading-tight">
        <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />~{eta}m{" "}
        {hasLiveTraffic ? "Light Traffic" : "Light (est.)"}
      </span>
    );
  }

  if (level === "MODERATE") {
    return (
      <span className="flex w-full max-w-full items-start gap-1 px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-700 rounded-lg border border-amber-200 whitespace-normal break-words leading-tight">
        <Clock className="w-3 h-3 shrink-0 mt-0.5" />~{eta}m{" "}
        {hasLiveTraffic ? "Moderate Traffic" : "Moderate (est.)"}
      </span>
    );
  }

  // Heavy Traffic
  const hasAlternatives = Boolean(
    hasLiveTraffic && data?.alternatives && data.alternatives.length > 0,
  );
  const alternatives = data?.alternatives ?? [];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (hasAlternatives) {
          onShowAlternatives(alternatives, destId);
        }
      }}
      disabled={!hasAlternatives}
      className={`flex w-full max-w-full items-start gap-1 px-2.5 py-1 text-[11px] font-medium bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 whitespace-normal break-words leading-tight ${
        hasAlternatives
          ? "hover:bg-yellow-100 cursor-pointer transition-colors"
          : "opacity-90 cursor-default"
      }`}
      title={
        hasAlternatives
          ? "Click to view time-saving alternatives"
          : hasLiveTraffic
            ? "No suitable alternatives found in your current area"
            : "Estimated from distance and average speed"
      }
    >
      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
      <span className="flex-1 min-w-0 text-left break-words">
        <span className="block">
          ~{eta}m {hasLiveTraffic ? "Heavy Traffic" : "Heavy (est.)"}
        </span>
        {hasAlternatives ? (
          <span className="mt-1 inline-flex px-1.5 py-0.5 bg-yellow-600 text-white font-bold rounded shadow-sm text-[10px] uppercase tracking-wider">
            Suggestions
          </span>
        ) : hasLiveTraffic ? (
          <span className="block text-yellow-500 opacity-75 mt-0.5">
            • No Alternatives Found
          </span>
        ) : null}
      </span>
    </button>
  );
}
