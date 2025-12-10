import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { businessApi, isGoogleAuthRequiredError, getApiErrorMessage } from "../services/api";
import RegisterMap from "../components/business/RegisterMap";

interface BusinessHours {
  day: string;
  start: string;
  end: string;
  closed: boolean;
}

interface FormData {
  name: string;
  description: string;
  categories: string[];
  hours: BusinessHours[];
  priceMin: string;
  priceMax: string;
  coverImage: string;
  gallery: string[];
  houseNumber: string;
  street: string;
  brgy: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const CATEGORIES = [
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

const initialHours: BusinessHours[] = DAYS.map((day) => ({
  day,
  start: "09:00",
  end: "17:00",
  closed: day === "Sunday",
}));

const initialFormData: FormData = {
  name: "",
  description: "",
  categories: [],
  hours: initialHours,
  priceMin: "",
  priceMax: "",
  coverImage: "",
  gallery: [],
  houseNumber: "",
  street: "",
  brgy: "",
  city: "Tagaytay",
  lat: null,
  lng: null,
};

/**
 * BusinessForm
 *
 * This component assumes the user is already authenticated (wrapped by RequireSupabaseAuth
 * via BusinessOnboarding). It renders the business registration/edit form.
 */
export default function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Map-related state
  const [locationSearch, setLocationSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lng: number; display_name: string }>>([]);

  // Fetch existing business data if editing
  useEffect(() => {
    if (isEdit && id && user) {
      fetchBusiness(id);
    }
  }, [id, isEdit, user]);

  const fetchBusiness = async (businessId: string) => {
    try {
      const data = await businessApi.getBusiness(businessId);

      // Map API data to form data
      setFormData({
        name: data.name || "",
        description: data.description || "",
        categories: data.categories?.map((c: { name: string }) => c.name) || [],
        hours: DAYS.map((day) => {
          const h = data.hours?.[day.toLowerCase()];
          return {
            day,
            start: h?.open || "09:00",
            end: h?.close || "17:00",
            closed: !h?.open,
          };
        }),
        priceMin: data.priceRange?.min?.toString() || "",
        priceMax: data.priceRange?.max?.toString() || "",
        coverImage: data.media?.cover || "",
        gallery: data.media?.gallery || [],
        houseNumber: data.location?.address?.split(",")[0] || "",
        street: data.location?.address?.split(",")[1] || "",
        brgy: data.location?.address?.split(",")[2] || "",
        city: data.location?.address?.split(",")[3] || "Tagaytay",
        lat: data.location?.lat || null,
        lng: data.location?.lng || null,
      });
    } catch (err) {
      console.error("Error fetching business:", err);
      setSubmitError("Failed to load business data");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const updateHours = (
    index: number,
    field: keyof BusinessHours,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      hours: prev.hours.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const handleImageUpload = async (
    files: FileList,
    type: "cover" | "gallery"
  ) => {
    if (!files.length) return;

    setUploading(true);
    setSubmitError("");
    
    const formDataUpload = new FormData();

    Array.from(files).forEach((file, i) => {
      formDataUpload.append("files", file);
      formDataUpload.append("names[]", `business_${Date.now()}_${i}`);
      formDataUpload.append("folders[]", "business_images");
    });

    try {
      const response = await api.post("/utils/upload_images", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = response.data;

      if (type === "cover" && data.secure_url?.[0]) {
        setFormData((prev) => ({ ...prev, coverImage: data.secure_url[0] }));
      } else if (type === "gallery" && data.secure_url?.length) {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, ...data.secure_url],
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setSubmitError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  /**
   * Handle pin move on the map (drag or click to place)
   */
  const handlePinMove = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
  }, []);

  /**
   * Search for a location using the backend map API
   */
  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    setSubmitError("");
    
    try {
      // Build search query with city context for better results
      const query = locationSearch.includes(formData.city) 
        ? locationSearch 
        : `${locationSearch}, ${formData.city}`;
      
      const response = await api.post("/map/search", { query });
      const result = response.data;
      
      if (result?.places && result.places.length > 0) {
        // Backend returns places with coordinates object: { coordinates: { lat, lng }, label, ... }
        setSearchResults(result.places.map((p: { 
          coordinates?: { lat: number; lng: number }; 
          lat?: number; 
          lng?: number; 
          label?: string;
          display_name?: string;
        }) => ({
          lat: Number(p.coordinates?.lat ?? p.lat),
          lng: Number(p.coordinates?.lng ?? p.lng),
          display_name: p.label || p.display_name || query,
        })));
      } else {
        setSubmitError("No locations found. Try a different search or click the map to place your pin manually.");
      }
    } catch (error) {
      console.error("Location search error:", error);
      setSubmitError("Failed to search location. You can click the map to place your pin manually.");
    } finally {
      setSearching(false);
    }
  };

  /**
   * Select a search result and place the pin
   */
  const selectSearchResult = (result: { lat: number; lng: number; display_name: string }) => {
    setFormData((prev) => ({ ...prev, lat: result.lat, lng: result.lng }));
    setSearchResults([]);
    setLocationSearch("");
  };

  /**
   * Auto-search when address fields change
   */
  const autoSearchFromAddress = async () => {
    const { street, brgy, city } = formData;
    if (!street && !brgy) return;
    
    const query = [street, brgy, city].filter(Boolean).join(", ");
    if (query.length < 5) return;
    
    setSearching(true);
    try {
      const response = await api.post("/map/search", { query });
      const result = response.data;
      
      if (result?.places?.[0]) {
        const place = result.places[0];
        // Backend returns places with coordinates object
        const lat = place.coordinates?.lat ?? place.lat;
        const lng = place.coordinates?.lng ?? place.lng;
        if (lat && lng) {
          setFormData((prev) => ({ 
            ...prev, 
            lat: Number(lat), 
            lng: Number(lng) 
          }));
        }
      }
    } catch (error) {
      console.error("Auto-search error:", error);
    } finally {
      setSearching(false);
    }
  };

  /**
   * Clear the current pin location
   */
  const clearPinLocation = () => {
    setFormData((prev) => ({ ...prev, lat: null, lng: null }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Business name is required";
    if (formData.categories.length === 0)
      newErrors.categories = "Select at least one category";
    if (!formData.city.trim()) newErrors.city = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSubmitError("Please log in to continue");
        setSubmitting(false);
        return;
      }

      // Build payload
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        house_no: formData.houseNumber.trim(),
        street: formData.street.trim(),
        brgy: formData.brgy.trim(),
        city: formData.city.trim(),
        lat: formData.lat,
        lng: formData.lng,
        secure_url: JSON.stringify({
          secure_url: [formData.coverImage, ...formData.gallery].filter(
            Boolean
          ),
        }),
        category: formData.categories,
        business_hrs: formData.hours
          .filter((h) => !h.closed)
          .map((h) => ({ day: h.day, start: h.start, end: h.end })),
        min_price: formData.priceMin ? parseInt(formData.priceMin) : 0,
        max_price: formData.priceMax ? parseInt(formData.priceMax) : 0,
      };

      let result;
      if (isEdit) {
        result = await businessApi.updateBusiness(id!, payload);
      } else {
        result = await businessApi.createBusiness(payload);
      }

      setSuccessMessage(isEdit ? "Business updated!" : "Business created!");

      setTimeout(() => {
        navigate(`/businesses/${result.business_id || id}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Submit error:", err);
      
      // Handle Google auth required error with specific messaging
      if (isGoogleAuthRequiredError(err)) {
        setSubmitError(
          "Business creation requires signing in with Google. Please sign out and sign in with your Google account to continue."
        );
        return;
      }
      
      // Handle axios error response
      let errorMessage = getApiErrorMessage(err);
      
      // Check for validation errors
      const axiosErr = err as { response?: { data?: { details?: Array<{ field: string; message: string }> } } };
      if (axiosErr.response?.data?.details && Array.isArray(axiosErr.response.data.details)) {
        errorMessage = axiosErr.response.data.details
          .map((d) => `${d.field}: ${d.message}`)
          .join(", ");
      }
      
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCategoryName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Show loading state while checking auth (should be brief since parent handles auth)
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/businesses"
            className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors duration-200 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Businesses
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isEdit ? "Edit Business" : "Register Your Business"}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? "Update your business information"
              : "List your business on TravelEase"}
          </p>
        </div>

        {/* Error/Success Messages */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 font-medium">{submitError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.name
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your business name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors resize-none"
                    placeholder="Describe your business"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Categories <span className="text-red-500">*</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.categories.includes(cat)
                        ? "bg-primary-red text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {formatCategoryName(cat)}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
              )}
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Operating Hours
              </h2>
              <div className="space-y-3">
                {formData.hours.map((h, index) => (
                  <div
                    key={h.day}
                    className="flex items-center gap-4 flex-wrap"
                  >
                    <span className="w-24 text-sm font-medium text-gray-700">
                      {h.day}
                    </span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={h.closed}
                        onChange={(e) =>
                          updateHours(index, "closed", e.target.checked)
                        }
                        className="w-4 h-4 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                      />
                      <span className="ml-2 text-sm text-gray-600">Closed</span>
                    </label>
                    {!h.closed && (
                      <>
                        <input
                          type="time"
                          value={h.start}
                          onChange={(e) =>
                            updateHours(index, "start", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={h.end}
                          onChange={(e) =>
                            updateHours(index, "end", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Price Range
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="priceMin"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Minimum (₱)
                  </label>
                  <input
                    type="number"
                    id="priceMin"
                    name="priceMin"
                    value={formData.priceMin}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    htmlFor="priceMax"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Maximum (₱)
                  </label>
                  <input
                    type="number"
                    id="priceMax"
                    name="priceMax"
                    value={formData.priceMax}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Photos
              </h2>

              {/* Cover Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image <span className="text-red-500">*</span>
                </label>
                
                {/* Image Preview */}
                {formData.coverImage && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={formData.coverImage}
                      alt="Cover preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop&auto=format";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Upload Area */}
                {!formData.coverImage && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-red transition-colors">
                    <input
                      type="file"
                      id="coverImageFile"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, "cover")}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="coverImageFile"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-8 h-8 animate-spin rounded-full border-b-2 border-primary-red" />
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600 font-medium">Click to upload cover image</span>
                          <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 6MB</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery <span className="text-gray-400">(optional)</span>
                </label>
                
                {/* Gallery Preview */}
                {formData.gallery.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {formData.gallery.map((url, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gallery Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-red transition-colors">
                  <input
                    type="file"
                    id="galleryImageFile"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files, "gallery")}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="galleryImageFile"
                    className="cursor-pointer flex flex-col items-center gap-1"
                  >
                    {uploading ? (
                      <>
                        <div className="w-6 h-6 animate-spin rounded-full border-b-2 border-primary-red" />
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm text-gray-600">Add gallery images</span>
                        <span className="text-xs text-gray-500">Select multiple files</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Location
              </h2>
              
              {/* Address Fields */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House/Building No.
                  </label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={formData.houseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    onBlur={autoSearchFromAddress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="brgy"
                    value={formData.brgy}
                    onChange={handleChange}
                    onBlur={autoSearchFromAddress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="Barangay"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red ${
                      errors.city
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Tagaytay"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
              </div>

              {/* Map Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Location on Map
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLocationSearch();
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="Search for a place (e.g., Sky Ranch, Tagaytay)"
                  />
                  <button
                    type="button"
                    onClick={handleLocationSearch}
                    disabled={searching}
                    className="px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-primary-red-dark disabled:opacity-50 transition-colors"
                  >
                    {searching ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-primary-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{result.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Map */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pin Your Business Location
                  </label>
                  {formData.lat && formData.lng && (
                    <button
                      type="button"
                      onClick={clearPinLocation}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear Pin
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {formData.lat && formData.lng 
                    ? "Drag the marker to adjust the exact location"
                    : "Click on the map to place your business pin, or use the search above"}
                </p>
                <div 
                  className="map-container-embedded rounded-lg overflow-hidden border border-gray-300"
                  style={{ height: "320px", width: "100%" }}
                >
                  <RegisterMap
                    pins={formData.lat && formData.lng ? [{ lat: formData.lat, lon: formData.lng }] : []}
                    onPinMove={handlePinMove}
                    allowClickToPlace={true}
                  />
                </div>
                {formData.lat && formData.lng && (
                  <p className="mt-2 text-xs text-gray-500">
                    📍 Coordinates: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>{isEdit ? "Update Business" : "Register Business"}</>
                )}
              </button>
              <Link to="/businesses" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-primary-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </h2>

              {formData.name || formData.coverImage ? (
                <div className="space-y-4">
                  {formData.coverImage && (
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={formData.coverImage}
                        alt={formData.name || "Preview"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {formData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-block bg-primary-red text-white px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {formatCategoryName(cat)}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900">
                    {formData.name || "Business Name"}
                  </h3>

                  {formData.description && (
                    <p className="text-gray-600 text-sm">
                      {formData.description}
                    </p>
                  )}

                  {(formData.priceMin || formData.priceMax) && (
                    <p className="text-sm text-gray-500">
                      Price Range: ₱{formData.priceMin || "0"} - ₱
                      {formData.priceMax || "..."}
                    </p>
                  )}

                  {formData.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      {[
                        formData.houseNumber,
                        formData.street,
                        formData.brgy,
                        formData.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    Preview will appear as you fill in the form
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
