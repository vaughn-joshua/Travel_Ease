import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdatePlan } from "../../features/travelPlans/mutations";
import type { TravelPlan, UpdatePlanPayload } from "../../types/travelPlan";
import { businessApi, userApi } from "../../services/api";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

interface EditPlanProps {
  data: TravelPlan[];
  travel_plan: string | number;
  on_close: () => void;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  max_slots: string;
  visibility: boolean;
}

// Format date for input (YYYY-MM-DD)
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export default function Edit_Plan({
  data,
  travel_plan,
  on_close,
}: EditPlanProps): React.ReactElement {
  const plan = data[0];
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Accommodation search state
  const [accommodationSearch, setAccommodationSearch] = useState<string>("");
  const [accommodationResults, setAccommodationResults] = useState<Array<{ business_id: number; name: string }>>([]);
  // Track initial accommodation to detect changes
  const initialAccommodationId = plan.accommodation?.business_id ?? null;
  const [selectedAccommodation, setSelectedAccommodation] = useState<{ business_id: number; name: string } | null>(
    plan.accommodation ? { business_id: plan.accommodation.business_id, name: plan.accommodation.name } : null
  );
  const [isSearchingAccommodation, setIsSearchingAccommodation] = useState<boolean>(false);
  const [showAccommodationDropdown, setShowAccommodationDropdown] = useState<boolean>(false);
  const [isAccommodationInputFocused, setIsAccommodationInputFocused] = useState<boolean>(false);
  const debouncedAccommodationSearch = useDebouncedValue(accommodationSearch, 300);

  // Use TanStack Query mutation for updating plans
  const updatePlanMutation = useUpdatePlan();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: plan.title || plan.name || "",
      description: plan.description || "",
      location: plan.location || "",
      start_date: formatDateForInput(plan.start_date),
      end_date: formatDateForInput(plan.end_date),
      max_slots: plan.max_slots?.toString() || plan.slots?.toString() || "",
      visibility: plan.visibility ?? plan.is_public ?? false,
    },
  });

  const startDate = watch("start_date");

  // Search for accommodation businesses
  useEffect(() => {
    const searchAccommodations = async () => {
      // If input is focused and search is empty, fetch all accommodations
      if (isAccommodationInputFocused && debouncedAccommodationSearch.length < 2) {
        setIsSearchingAccommodation(true);
        try {
          const response = await businessApi.getTravelSpots({
            category: "accommodation",
            limit: 50 // Higher limit when showing all accommodations
          });
          const results = response.data.map(b => ({
            business_id: b.business_id,
            name: b.name
          }));
          setAccommodationResults(results);
          setShowAccommodationDropdown(results.length > 0);
        } catch (error) {
          console.error("Error fetching accommodations:", error);
          setAccommodationResults([]);
        } finally {
          setIsSearchingAccommodation(false);
        }
        return;
      }

      // If search query is less than 2 characters and not focused, clear results
      if (debouncedAccommodationSearch.length < 2) {
        setAccommodationResults([]);
        setShowAccommodationDropdown(false);
        return;
      }

      // Perform search when user types
      setIsSearchingAccommodation(true);
      try {
        const response = await businessApi.getTravelSpots({
          search: debouncedAccommodationSearch,
          category: "accommodation",
          limit: 10
        });
        const results = response.data.map(b => ({
          business_id: b.business_id,
          name: b.name
        }));
        setAccommodationResults(results);
        setShowAccommodationDropdown(results.length > 0);
      } catch (error) {
        console.error("Error searching accommodations:", error);
        setAccommodationResults([]);
      } finally {
        setIsSearchingAccommodation(false);
      }
    };

    searchAccommodations();
  }, [debouncedAccommodationSearch, isAccommodationInputFocused]);

  // Add an accommodation to the selected list
  const addAccommodation = (accommodation: { business_id: number; name: string }) => {
    setSelectedAccommodation(accommodation);
    setAccommodationSearch("");
    setAccommodationResults([]);
    setShowAccommodationDropdown(false);
  };

  // Remove accommodation
  const removeAccommodation = () => {
    setSelectedAccommodation(null);
    setAccommodationSearch("");
  };

  const on_submit = async (formData: FormData): Promise<void> => {
    setSubmitError(null);

    // Determine accommodation_id: only include if it changed
    let accommodation_id: number | null | undefined = undefined;
    const currentAccommodationId = selectedAccommodation?.business_id ?? null;
    if (currentAccommodationId !== initialAccommodationId) {
      // Accommodation changed - send the new value (number or null to remove)
      accommodation_id = currentAccommodationId;
    }

    const payload: UpdatePlanPayload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      slots: formData.max_slots ? parseInt(formData.max_slots, 10) : undefined,
      is_public: formData.visibility,
      accommodation_id,
    };

    console.log("[EditPlan] ========== EDIT PLAN ATTEMPT ==========");
    console.log("[EditPlan] Plan ID:", travel_plan);
    console.log("[EditPlan] Form data:", formData);
    console.log("[EditPlan] Initial accommodation ID:", initialAccommodationId);
    console.log("[EditPlan] Selected accommodation:", selectedAccommodation);
    console.log("[EditPlan] Accommodation ID to send:", accommodation_id);
    console.log("[EditPlan] Final payload:", JSON.stringify(payload, null, 2));
    console.log("[EditPlan] Token exists:", !!localStorage.getItem("token"));
    console.log("[EditPlan] Mutation state - isPending:", updatePlanMutation.isPending);

    updatePlanMutation.mutate(
      { id: travel_plan, data: payload },
      {
        onSuccess: (response) => {
          console.log("[EditPlan] ✅ SUCCESS - Response:", response);
          on_close();
        },
        onError: (error) => {
          console.error("[EditPlan] ❌ ERROR - Full error object:", error);
          console.error("[EditPlan] Error message:", error instanceof Error ? error.message : String(error));
          console.error("[EditPlan] Error stack:", error instanceof Error ? error.stack : "No stack");
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as any;
            console.error("[EditPlan] Response status:", axiosError.response?.status);
            console.error("[EditPlan] Response data:", axiosError.response?.data);
          }
          setSubmitError(
            error instanceof Error ? error.message : "Failed to update plan"
          );
        },
      }
    );
  };

  const { user, refreshProfile, signInWithGoogle, isGoogleAuth } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check role on mount/update to ensure we have latest
  useEffect(() => {
    // Optional: could re-fetch user if needed
  }, []);

  const handlePublishPlan = async () => {
    // Logic:
    // 1. Check if user is agency
    // 2. If yes, set visibility to true
    // 3. If no, show upgrade modal

    if (user?.role === 'TRAVEL_AGENCY') {
      const currentVisibility = watch('visibility');
      if (currentVisibility) {
        toast.success("Plan is already public!");
        return;
      }
      setValue('visibility', true, { shouldDirty: true });
      toast.success("Plan marked as public! Don't forget to save changes.");
      return;
    }

    // Role is not agency -> Show modal
    setShowUpgradeModal(true);
  };

  const handleUpgradeConfirm = async () => {
    setIsUpgrading(true);
    try {
      const result = await userApi.upgradeToAgency();
      toast.success(result.message);

      // Refresh auth context/user role
      refreshProfile();
      setShowUpgradeModal(false);

      // Auto-set visibility to true after upgrade
      setValue('visibility', true, { shouldDirty: true });
      toast.success("Account upgraded! Plan marked as public. Please save changes.");

    } catch (error: any) {
      console.error("Upgrade error:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to upgrade";
      toast.error(msg);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleConnectGoogle = async () => {
    // 1. Save plan as draft (visibility false) to prevent data loss
    // 2. Trigger Google Sign In (redirects)
    setIsConnecting(true);

    // We need to trigger the form submit handler manually with visibility=false
    handleSubmit(async (formData) => {
      try {
        // Create payload with visibility explicitly false (draft)
        // We rely on on_submit to handle the mutation
        // But on_submit expects FormData, so we pass it directly
        // We just Ensure visibility is false in the data we pass if we could, 
        // but on_submit reads from formData. 
        // Let's force visibility false in the form state first.
        setValue('visibility', false);

        // We need to await the mutation. on_submit is async but returns void. 
        // updatePlanMutation.mutate is triggered. We can't easily await it here 
        // because on_submit doesn't return the promise of the mutation.
        // However, we can just trigger the mutation directly or trust on_submit.
        // For safety, let's just use on_submit and wait a bit, then redirect? 
        // Or better: Modify on_submit to return promise? It does return Promise<void>.

        await on_submit({ ...formData, visibility: false });

        toast.loading("Redirecting to Google...", { duration: 3000 });
        await signInWithGoogle();

      } catch (error) {
        console.error("Failed to save draft before redirect:", error);
        toast.error("Failed to save draft. Please save manually first.");
        setIsConnecting(false);
      }
    })();
  };

  return (
    <>
      <div className="modal">
        <div className="modal_body max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-red-600">Edit Plan</h1>

              {/* Publish Plan Button in Header */}
              <button
                type="button"
                onClick={handlePublishPlan}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shadow-sm flex items-center gap-1 ${watch('visibility')
                    ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md '
                  }`}
                title={watch('visibility') ? "Plan is public" : "Make this plan visible for all to join"}
              >
                {watch('visibility') ? (
                  <>
                    <span>🌍</span> Published
                  </>
                ) : (
                  <>
                    <span>🚀</span> Publish Plan
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(on_submit)} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                {...register("title", { required: "Title is required" })}
                className="text_box"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                {...register("description")}
                className="text_box resize-none"
                rows={3}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Location <span className="font-light">(fixed)</span>
              </label>
              <input
                {...register("location")}
                className="text_box"
                value="Tagaytay City"
                readOnly
              />
              {errors.location && (
                <p className="text-red-500 text-sm">{errors.location.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  {...register("start_date")}
                  className="text_box"
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  {...register("end_date", {
                    validate: (value) => {
                      if (startDate && value && value < startDate) {
                        return "End date must be after start date";
                      }
                      return true;
                    },
                  })}
                  min={startDate || undefined}
                  className="text_box"
                />
                {errors.end_date && (
                  <p className="text-red-500 text-sm">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Max Participants</label>
              <input
                type="number"
                min="1"
                {...register("max_slots", {
                  validate: (value) => {
                    if (value && parseInt(value, 10) < 1) {
                      return "Must be at least 1";
                    }
                    return true;
                  },
                })}
                className="text_box"
                placeholder="No limit"
              />
              {errors.max_slots && (
                <p className="text-red-500 text-sm">{errors.max_slots.message}</p>
              )}
            </div>

            {/* Accommodation Search */}
            <div>
              <label className="label">Accommodation (Optional)</label>

              {/* Selected accommodation as chip */}
              {selectedAccommodation && (
                <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-2 rounded-full text-sm mb-2 w-fit">
                  <span>🛏️ {selectedAccommodation.name}</span>
                  <button
                    type="button"
                    onClick={removeAccommodation}
                    className="ml-1 text-red-600 hover:text-red-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Accommodation search input with dropdown */}
              {!selectedAccommodation && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🛏️
                  </span>
                  <input
                    type="text"
                    value={accommodationSearch}
                    onChange={(e) => setAccommodationSearch(e.target.value)}
                    onFocus={() => {
                      setIsAccommodationInputFocused(true);
                      // Show dropdown if there are already results
                      if (accommodationResults.length > 0) {
                        setShowAccommodationDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsAccommodationInputFocused(false);
                        setShowAccommodationDropdown(false);
                      }, 200);
                    }}
                    placeholder="Search for accommodation..."
                    className="text_box pl-10"
                  />
                  {isSearchingAccommodation && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </span>
                  )}

                  {/* Dropdown with search results */}
                  {showAccommodationDropdown && accommodationResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {accommodationResults.map((acc) => (
                        <button
                          key={acc.business_id}
                          type="button"
                          onClick={() => addAccommodation(acc)}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-800">
                            {acc.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Search for accommodation businesses to add to your plan
              </p>
            </div>

            {/* Hidden visibility input to maintain state without UI toggle */}
            <input type="hidden" {...register("visibility")} />

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}

            <div className="flex justify-between items-center gap-2 pt-4">
              <div></div> {/* Spacer since we removed bottom button */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={on_close}
                  disabled={updatePlanMutation.isPending}
                  className="soft_btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePlanMutation.isPending}
                  className="hard_btn"
                >
                  {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚀</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Upgrade to Travel Agency?</h2>
                <p className="text-gray-600 mb-4">
                  Only <span className="font-semibold text-blue-600">Travel Agencies</span> can make travel plans public.
                  Upgrade your account for free to unlock this feature!
                </p>

                {!isGoogleAuth && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-left mb-4">
                    <strong>Verification Required:</strong> You must connect your Google account to upgrade.
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  disabled={isUpgrading || isConnecting}
                >
                  Cancel
                </button>

                {isGoogleAuth ? (
                  <button
                    onClick={handleUpgradeConfirm}
                    disabled={isUpgrading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {isUpgrading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Upgrading...
                      </>
                    ) : (
                      "Upgrade Now"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {isConnecting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                        Connect Google & Upgrade
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
