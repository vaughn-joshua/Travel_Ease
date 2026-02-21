import React from "react";
import { useTrafficSuggestion } from "../../features/travelPlans/queries";
import { AlertTriangle, Clock, MapPin, CheckCircle2 } from "lucide-react";

interface TrafficSuggestionProps {
    originId: number | null;
    destId: number;
    dayGroup?: "weekday" | "weekend";
    originLat?: number;
    originLng?: number;
    onShowAlternatives: (alternatives: any[], triggeringDestId: number) => void;
}

export default function TrafficSuggestion({
    originId,
    destId,
    dayGroup = "weekday",
    originLat,
    originLng,
    onShowAlternatives,
}: TrafficSuggestionProps) {
    const { data, isLoading } = useTrafficSuggestion(originId, destId, dayGroup, originLat, originLng);

    if (isLoading) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-500 rounded-lg border border-gray-200 animate-pulse">
                <Clock className="w-3 h-3 px-0.5" />
                Calculating...
            </span>
        );
    }

    if (!data || !data.trafficLevel || data.trafficLevel === 'UNKNOWN') return null;

    const eta = Math.round(data.eta || 0);

    if (data.trafficLevel === 'LIGHT') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg border border-green-200">
                <CheckCircle2 className="w-3 h-3" />
                ~{eta}m Light Traffic
            </span>
        );
    }

    if (data.trafficLevel === 'MODERATE') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <Clock className="w-3 h-3" />
                ~{eta}m Moderate Traffic
            </span>
        );
    }

    // Heavy Traffic
    const hasAlternatives = data.alternatives && data.alternatives.length > 0;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (hasAlternatives) {
                    onShowAlternatives(data.alternatives!, destId);
                }
            }}
            disabled={!hasAlternatives}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg border border-red-200 ${hasAlternatives
                ? "hover:bg-red-100 cursor-pointer transition-colors"
                : "opacity-90 cursor-default"
                }`}
            title={hasAlternatives ? "Click to view time-saving alternatives" : "No suitable alternatives found in your current area"}
        >
            <AlertTriangle className="w-3 h-3" />
            <span>~{eta}m Heavy Traffic</span>
            {hasAlternatives ? (
                <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white font-bold rounded shadow-sm text-[10px] uppercase tracking-wider">
                    View Alternatives
                </span>
            ) : (
                <span className="text-red-500 ml-0.5 opacity-75">• No Alternatives Found</span>
            )}
        </button>
    );
}
