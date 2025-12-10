/**
 * Create_Plan Component
 *
 * A 3–step modal form that allows users to create a travel plan.
 * Uses native HTML date inputs for better compatibility and easier testing.
 */

import { useState, useEffect } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { useCreatePlan } from "../../features/travelPlans/mutations";
import type { CreatePlanPayload, CollaboratorPayload } from "../../types/travelPlan";
import { userApi, type UserSearchResult } from "../../services/api";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
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
}

interface SelectedCollaborator {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export default function Create_Plan({
  on_close,
}: CreatePlanProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange", // Validate on change for better UX
  });

  const [counter, setCounter] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Collaborator search state
  const [emailSearch, setEmailSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<SelectedCollaborator[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Debounce the search queries
  const debouncedSearch = useDebouncedValue(emailSearch, 300);

  // Use TanStack Query mutation for creating plans
  const createPlanMutation = useCreatePlan();

  // Watch values for validation and display
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  // Search for users when debounced search changes
  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedSearch.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await userApi.searchUsers(debouncedSearch);
        // Filter out already selected users
        const filtered = results.filter(
          (user) => !selectedCollaborators.some((c) => c.user_id === user.user_id)
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch, selectedCollaborators]);

  // Add a collaborator to the selected list
  const addCollaborator = (user: UserSearchResult) => {
    setSelectedCollaborators((prev) => [...prev, user]);
    setEmailSearch("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Remove a collaborator from the selected list
  const removeCollaborator = (userId: number) => {
    setSelectedCollaborators((prev) => prev.filter((c) => c.user_id !== userId));
  };

  const handle_back = (): void => {
    setCounter((prev) => prev - 1);
  };

  // Handle step navigation with validation
  const handleNext = async (): Promise<void> => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (counter === 0) {
      fieldsToValidate = ["title", "description"];
    } else if (counter === 1) {
      fieldsToValidate = ["location", "start_date", "end_date"];
    } else if (counter === 2) {
      fieldsToValidate = ["slots"];
    }

    // Validate only the current step's fields
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      if (counter < 2) {
        setCounter((prev) => prev + 1);
      }
    }
  };

  // Final submission
  const on_submit = async (d: FormData): Promise<void> => {
    setSubmitError(null);

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setSubmitError("Please log in to create a travel plan.");
      return;
    }

    // Map selected collaborators to the payload format
    const collaborators: CollaboratorPayload[] = selectedCollaborators.map((c) => ({
      user_id: c.user_id,
      role: "Viewer" as const,
      status: true,
    }));

    const payload: CreatePlanPayload = {
      title: d.title,
      description: d.description,
      location: d.location,
      start_date: d.start_date,
      end_date: d.end_date,
      slots: d.slots ? parseInt(d.slots, 10) : undefined,
      collaborators: collaborators.length > 0 ? collaborators : undefined,
    };

    console.log("[CreatePlan] ========== CREATE PLAN ATTEMPT ==========");
    console.log("[CreatePlan] Form data:", d);
    console.log("[CreatePlan] Selected collaborators:", selectedCollaborators);
    console.log("[CreatePlan] Final payload:", JSON.stringify(payload, null, 2));
    console.log("[CreatePlan] Token exists:", !!localStorage.getItem("token"));
    console.log("[CreatePlan] Mutation state - isPending:", createPlanMutation.isPending);

    createPlanMutation.mutate(payload, {
      onSuccess: (response) => {
        console.log("[CreatePlan] ✅ SUCCESS - Response:", response);
        setCounter(0);
        setSelectedCollaborators([]);
        on_close();
      },
      onError: (error) => {
        console.error("[CreatePlan] ❌ ERROR - Full error object:", error);
        console.error("[CreatePlan] Error message:", error instanceof Error ? error.message : String(error));
        console.error("[CreatePlan] Error stack:", error instanceof Error ? error.stack : "No stack");
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          console.error("[CreatePlan] Response status:", axiosError.response?.status);
          console.error("[CreatePlan] Response data:", axiosError.response?.data);
        }
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to create plan. Please try again."
        );
      },
    });
  };

  const typedErrors = errors as FieldErrors<FormData>;

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[0, 1, 2].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              transition-all duration-200
              ${
                step === counter
                  ? "bg-red-500 text-white shadow-lg scale-110"
                  : step < counter
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }
            `}
          >
            {step < counter ? "✓" : step + 1}
          </div>
          {step < 2 && (
            <div
              className={`w-12 h-1 mx-1 rounded ${
                step < counter ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <h2 className="text-white text-lg font-semibold text-center">
            {counter === 0 && "Create New Plan"}
            {counter === 1 && "Travel Details"}
            {counter === 2 && "Team Setup"}
          </h2>
        </div>

        <form onSubmit={handleSubmit(on_submit)} className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <StepIndicator />
            {/* Step 1: Basic Info */}
            {counter === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Title
                  </label>
                  <input
                    {...register("title", { required: "Title is required" })}
                    placeholder="e.g., Summer Beach Getaway"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  />
                  {typedErrors.title && (
                    <p className="text-red-500 text-xs mt-1">
                      {typedErrors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register("description", {
                      required: "Description is required",
                    })}
                    placeholder="Describe your travel plan..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none"
                  />
                  {typedErrors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {typedErrors.description.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Location & Dates */}
            {counter === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Location <span className="font-light">(fixed)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      📍
                    </span>
                    <input
                      {...register("location", {
                        required: "Location is required",
                      })}
                      value="Tagaytay Cavite"
                      readOnly
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  {typedErrors.location && (
                    <p className="text-red-500 text-xs mt-1">
                      {typedErrors.location.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        📅
                      </span>
                      <input
                        type="date"
                        {...register("start_date", {
                          required: "Start date is required",
                        })}
                        min={today}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none cursor-pointer"
                      />
                    </div>
                    {typedErrors.start_date && (
                      <p className="text-red-500 text-xs mt-1">
                        {typedErrors.start_date.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        📅
                      </span>
                      <input
                        type="date"
                        {...register("end_date", {
                          required: "End date is required",
                          validate: (value) => {
                            if (startDate && value < startDate) {
                              return "End date must be after start date";
                            }
                            return true;
                          },
                        })}
                        min={startDate || today}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none cursor-pointer"
                      />
                    </div>
                    {typedErrors.end_date && (
                      <p className="text-red-500 text-xs mt-1">
                        {typedErrors.end_date.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date range preview */}
                {startDate && endDate && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Trip Duration:</span>{" "}
                      {Math.ceil(
                        (new Date(endDate).getTime() -
                          new Date(startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}{" "}
                      days
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Team Setup */}
            {counter === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Participants
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      👥
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register("slots", {
                        required: "Number of slots is required",
                        validate: (value) => {
                          const num = parseInt(value || "", 10);
                          if (isNaN(num)) return "Please enter a valid number";
                          if (num < 1) return "At least 1 slot required";
                          if (num > 50) return "Maximum 50 slots allowed";
                          return true;
                        },
                      })}
                      placeholder="e.g., 5"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  {typedErrors.slots && (
                    <p className="text-red-500 text-xs mt-1">
                      {typedErrors.slots.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    How many people can join this trip?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite Collaborators (Optional)
                  </label>
                  
                  {/* Selected collaborators as chips */}
                  {selectedCollaborators.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCollaborators.map((collab) => (
                        <div
                          key={collab.user_id}
                          className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{collab.email}</span>
                          <button
                            type="button"
                            onClick={() => removeCollaborator(collab.user_id)}
                            className="ml-1 text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Email search input with dropdown */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ✉️
                    </span>
                    <input
                      type="text"
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder="Search by email..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                    />
                    {isSearching && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </span>
                    )}

                    {/* Dropdown with search results */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.user_id}
                            type="button"
                            onClick={() => addCollaborator(user)}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-800">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Search for users by email to invite them as collaborators
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                  <h3 className="font-medium text-gray-800 mb-2">
                    Plan Summary
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📝 {watch("title") || "Untitled Plan"}</p>
                    <p>📍 {watch("location") || "No location set"}</p>
                    <p>
                      📅 {watch("start_date") || "?"} →{" "}
                      {watch("end_date") || "?"}
                    </p>
                    {selectedCollaborators.length > 0 && (
                      <p>👥 {selectedCollaborators.length} collaborator(s) invited</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <span>⚠️</span> {submitError}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={on_close}
              disabled={createPlanMutation.isPending}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>

            {counter > 0 && (
              <button
                type="button"
                onClick={handle_back}
                disabled={createPlanMutation.isPending}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Back
              </button>
            )}

            {counter < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={createPlanMutation.isPending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={createPlanMutation.isPending}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPlanMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Plan"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
