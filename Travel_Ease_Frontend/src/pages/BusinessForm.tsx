import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { endpoints } from "../config/api.js";

interface MenuItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

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
  menuItems: MenuItem[];
  houseNumber: string;
  street: string;
  brgy: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  menuItems: [],
  houseNumber: "",
  street: "",
  brgy: "",
  city: "Tagaytay",
  lat: null,
  lng: null,
};

export default function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch existing business data if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchBusiness(id);
    }
  }, [id, isEdit]);

  const fetchBusiness = async (businessId: string) => {
    try {
      const response = await fetch(endpoints.business.byId(businessId));
      if (!response.ok) throw new Error("Business not found");
      const data = await response.json();

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
        menuItems: data.menuItems || [],
        houseNumber: data.location?.houseNumber || "",
        street: data.location?.street || "",
        brgy: data.location?.brgy || "",
        city: data.location?.city || "Tagaytay",
        lat: data.location?.lat || null,
        lng: data.location?.lng || null,
      });
    } catch (err) {
      console.error("Error fetching business:", err);
      setSubmitError("Failed to load business data");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  const updateHours = (index: number, field: keyof BusinessHours, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      hours: prev.hours.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const handleImageUpload = async (files: FileList, type: "cover" | "gallery") => {
    if (!files.length) return;

    setUploading(true);
    const formDataUpload = new FormData();

    Array.from(files).forEach((file, i) => {
      formDataUpload.append("files", file);
      formDataUpload.append("names[]", `business_${Date.now()}_${i}`);
      formDataUpload.append("folders[]", "business_images");
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.utils.uploadImages, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      if (type === "cover" && data.secure_url?.[0]) {
        setFormData((prev) => ({ ...prev, coverImage: data.secure_url[0] }));
      } else if (type === "gallery") {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, ...data.secure_url],
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setSubmitError("Failed to upload image");
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

  // Menu item handlers
  const addMenuItem = () => {
    setFormData((prev) => ({
      ...prev,
      menuItems: [
        ...prev.menuItems,
        { name: "", description: "", price: 0, imageUrl: "", category: "" },
      ],
    }));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      menuItems: prev.menuItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeMenuItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      menuItems: prev.menuItems.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Business name is required";
    if (formData.categories.length === 0) newErrors.categories = "Select at least one category";
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
          secure_url: [formData.coverImage, ...formData.gallery].filter(Boolean),
        }),
        category: formData.categories,
        business_hrs: formData.hours
          .filter((h) => !h.closed)
          .map((h) => ({ day: h.day, start: h.start, end: h.end })),
      };

      const url = isEdit ? endpoints.business.edit(id!) : endpoints.business.create;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save business");
      }

      const result = await response.json();
      setSuccessMessage(isEdit ? "Business updated!" : "Business created!");

      // Save menu items if any
      if (formData.menuItems.length > 0) {
        const businessId = result.business_id || id;
        for (const item of formData.menuItems) {
          if (!item.name || !item.price) continue;
          await fetch(`${endpoints.business.base}/${businessId}/menu`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              category: item.category,
            }),
          });
        }
      }

      setTimeout(() => {
        navigate(`/businesses/${result.business_id || id}`);
      }, 1500);
    } catch (err: unknown) {
      console.error("Submit error:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save business");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCategoryName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/businesses"
            className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{submitError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Enter your business name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
              <div className="space-y-3">
                {formData.hours.map((h, index) => (
                  <div key={h.day} className="flex items-center gap-4 flex-wrap">
                    <span className="w-24 text-sm font-medium text-gray-700">{h.day}</span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={h.closed}
                        onChange={(e) => updateHours(index, "closed", e.target.checked)}
                        className="w-4 h-4 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                      />
                      <span className="ml-2 text-sm text-gray-600">Closed</span>
                    </label>
                    {!h.closed && (
                      <>
                        <input
                          type="time"
                          value={h.start}
                          onChange={(e) => updateHours(index, "start", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={h.end}
                          onChange={(e) => updateHours(index, "end", e.target.value)}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Range</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priceMin" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="priceMax" className="block text-sm font-medium text-gray-700 mb-2">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>

              {/* Cover Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="flex items-start gap-4">
                  {formData.coverImage ? (
                    <div className="relative w-40 h-28">
                      <img
                        src={formData.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-red transition-colors">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files, "cover")}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery</label>
                <div className="flex flex-wrap gap-3">
                  {formData.gallery.map((url, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-red transition-colors">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, "gallery")}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && (
                  <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
                <button
                  type="button"
                  onClick={addMenuItem}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-primary-red border border-primary-red rounded-lg hover:bg-primary-red hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Item
                </button>
              </div>

              {formData.menuItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No menu items added yet.</p>
              ) : (
                <div className="space-y-4">
                  {formData.menuItems.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeMenuItem(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateMenuItem(index, "name", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price || ""}
                          onChange={(e) => updateMenuItem(index, "price", parseFloat(e.target.value) || 0)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <input
                          type="text"
                          placeholder="Category"
                          value={item.category}
                          onChange={(e) => updateMenuItem(index, "category", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <input
                          type="text"
                          placeholder="Image URL (optional)"
                          value={item.imageUrl}
                          onChange={(e) => updateMenuItem(index, "imageUrl", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                      </div>
                      <textarea
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateMenuItem(index, "description", e.target.value)}
                        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red resize-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                  <input
                    type="text"
                    name="brgy"
                    value={formData.brgy}
                    onChange={handleChange}
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
                      errors.city ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Tagaytay"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
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
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                <svg className="w-5 h-5 mr-2 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                    <p className="text-gray-600 text-sm">{formData.description}</p>
                  )}

                  {(formData.priceMin || formData.priceMax) && (
                    <p className="text-sm text-gray-500">
                      Price Range: ₱{formData.priceMin || "0"} - ₱{formData.priceMax || "..."}
                    </p>
                  )}

                  {formData.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {[formData.houseNumber, formData.street, formData.brgy, formData.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

