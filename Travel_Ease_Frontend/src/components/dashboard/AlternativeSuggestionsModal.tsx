import React from "react";
import { X, MapPin } from "lucide-react";

interface AlternativeSuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    alternatives: any[];
    onAddAlternative: (business: any) => void;
    addingBusinessId: number | null;
}

export default function AlternativeSuggestionsModal({
    isOpen,
    onClose,
    alternatives,
    onAddAlternative,
    addingBusinessId
}: AlternativeSuggestionsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in relative overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Alternative Suggestions</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Consider these highly-rated businesses nearby to save travel time.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={addingBusinessId !== null}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto bg-gray-50/50 flex-1">
                    <div className="space-y-4">
                        {alternatives.map((business, idx) => (
                            <div
                                key={idx}
                                className="group bg-white p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                            >
                                {/* Image thumbnail */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                    {business.picture ? (
                                        <img
                                            src={business.picture}
                                            alt={business.name}
                                            className="w-full h-full object-cover  transition-transform"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <MapPin className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-lg sm:text-base line-clamp-1" title={business.name}>
                                        {business.name}
                                    </h4>

                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        {business.rating && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex-shrink-0">
                                                ★ {Number(business.rating).toFixed(1)}
                                            </span>
                                        )}
                                        {business.city && (
                                            <span className="text-xs text-gray-500 truncate flex-shrink-0">
                                                {business.city}
                                            </span>
                                        )}
                                    </div>

                                    {business.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {business.description}
                                        </p>
                                    )}
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => onAddAlternative(business)}
                                    disabled={addingBusinessId !== null}
                                    className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-primary-red hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {addingBusinessId === business.id ? "Adding..." : "Add to Itinerary"}
                                </button>
                            </div>
                        ))}

                        {alternatives.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No alternatives found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
