import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { endpoints } from "../config/api.js";

const CATEGORIES = [
  "food", "drinks", "accomodation", "souvenir_shop",
  "nature", "night_life", "leisure", "activities", "local_offers"
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const initialFormData = {
  name: "",
  description: "",
  categories: [],
  hours: DAYS.reduce((acc, day) => ({ ...acc, [day]: { open: "", close: "", closed: false } }), {}),
  priceMin: "",
  priceMax: "",
  houseNumber: "",
  street: "",
  brgy: "",
  city: "",
  lat: null,
  lng: null,
  coverImage: null,
  gallery: [],
  menuItems: [],
};

export default function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  // Load business data for edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchBusiness();
    }
  }, [id]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.business.byId(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Business not found");
      const data = await response.json();
      
      // Map API response to form data
      setFormData({
        name: data.name || "",
        description: data.description || "",
        categories: data.categories?.map(c => c.name) || [],
        hours: DAYS.reduce((acc, day) => ({
          ...acc,
          [day]: {
            open: data.hours?.[day]?.open || "",
            close: data.hours?.[day]?.close || "",
            closed: !data.hours?.[day]?.open,
          }
        }), {}),
        priceMin: data.priceRange?.min?.toString() || "",
        priceMax: data.priceRange?.max?.toString() || "",
        houseNumber: data.location?.houseNumber || "",
        street: data.location?.street || "",
        brgy: data.location?.brgy || "",
        city: data.location?.city || "",
        lat: data.location?.lat || null,
        lng: data.location?.lng || null,
        coverImage: data.media?.cover || null,
        gallery: data.media?.gallery || [],
        menuItems: data.menuItems || [],
      });
    } catch (error) {
      setSubmitError("Failed to load business data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [field]: value },
      },
    }));
  };

  const handleDayClosed = (day, closed) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { open: "", close: "", closed },
      },
    }));
  };

  // Menu items management
  const addMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, { name: "", description: "", price: "", category: "", imageUrl: "" }],
    }));
  };

  const updateMenuItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeMenuItem = (index) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter((_, i) => i !== index),
    }));
  };

  // Image upload handler
  const handleImageUpload = async (files, type) => {
    if (!files.length) return;
    setUploading(true);

    try {
      const formDataUpload = new FormData();
      const names = [];
      const folders = [];
      
      Array.from(files).forEach((file, i) => {
        formDataUpload.append("files", file);
        names.push(`${type}_${Date.now()}_${i}`);
        folders.push("business_images");
      });
      formDataUpload.append("names", JSON.stringify(names));
      formDataUpload.append("folders", JSON.stringify(folders));

      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.utils.uploadImages, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();

      if (type === "cover") {
        setFormData(prev => ({ ...prev, coverImage: data.secure_url[0] }));
      } else {
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...data.secure_url] }));
      }
    } catch (error) {
      setSubmitError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Business name is required";
    if (formData.categories.length === 0) newErrors.categories = "Select at least one category";
    if (!formData.city.trim()) newErrors.city = "City is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem("token");
      
      // Build business hours array
      const businessHours = DAYS.map(day => ({
        day,
        start: formData.hours[day].closed ? null : formData.hours[day].open || null,
        end: formData.hours[day].closed ? null : formData.hours[day].close || null,
      }));

      // Build payload
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        house_no: formData.houseNumber,
        street: formData.street,
        brgy: formData.brgy,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng,
        category: formData.categories,
        business_hrs: businessHours,
        secure_url: JSON.stringify({ 
          secure_url: formData.coverImage 
            ? [formData.coverImage, ...formData.gallery] 
            : formData.gallery 
        }),
      };

      const url = isEditMode 
        ? endpoints.business.edit(id) 
        : endpoints.business.create;
      const method = isEditMode ? "PUT" : "POST";

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
      
      // Handle menu items separately for new business
      if (!isEditMode && formData.menuItems.length > 0) {
        const businessId = result.business_id;
        for (const item of formData.menuItems) {
          if (item.name && item.price) {
            await fetch(`${endpoints.business.base}/${businessId}/menu`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: item.name,
                description: item.description,
                price: parseFloat(item.price),
                category: item.category,
                image_url: item.imageUrl,
              }),
            });
          }
        }
      }

      setSuccessMessage(isEditMode ? "Business updated successfully!" : "Business created successfully!");
      setTimeout(() => {
        navigate(`/business/${result.business_id || id}`);
      }, 1500);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business...</p>
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
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Businesses
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isEditMode ? "Edit Business" : "Create New Business"}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? "Update your business information" : "Register your business on TravelEase"}
          </p>
        </div>

        {/* Error/Success Messages */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red ${
                      errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Enter your business name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red resize-none"
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
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.categories.includes(category)
                        ? "bg-primary-red text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              {errors.categories && <p className="mt-2 text-sm text-red-600">{errors.categories}</p>}
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
              <div className="space-y-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-gray-700 capitalize">{day}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hours[day].closed}
                        onChange={e => handleDayClosed(day, e.target.checked)}
                        className="w-4 h-4 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                      />
                      <span className="text-sm text-gray-600">Closed</span>
                    </label>
                    {!formData.hours[day].closed && (
                      <>
                        <input
                          type="time"
                          value={formData.hours[day].open}
                          onChange={e => handleHoursChange(day, "open", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={formData.hours[day].close}
                          onChange={e => handleHoursChange(day, "close", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (PHP)</label>
                  <input
                    type="number"
                    name="priceMin"
                    value={formData.priceMin}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (PHP)</label>
                  <input
                    type="number"
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

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House/Building No.</label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={formData.houseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
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
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
              
              {/* Cover Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                {formData.coverImage ? (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: null }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-red transition-colors">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-2 text-sm text-gray-500">Click to upload cover image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e.target.files, "cover")}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery</label>
                <div className="grid grid-cols-3 gap-4">
                  {formData.gallery.map((url, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-red transition-colors">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="mt-1 text-xs text-gray-500">Add photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleImageUpload(e.target.files, "gallery")}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              
              {uploading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-red"></div>
                  Uploading...
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
                <button
                  type="button"
                  onClick={addMenuItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-red border border-primary-red rounded-lg hover:bg-primary-red hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>
              
              {formData.menuItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No menu items added yet. Click "Add Item" to start.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.menuItems.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-gray-500">Item #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeMenuItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateMenuItem(index, "name", e.target.value)}
                          placeholder="Item name"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={e => updateMenuItem(index, "price", e.target.value)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <input
                          type="text"
                          value={item.category}
                          onChange={e => updateMenuItem(index, "category", e.target.value)}
                          placeholder="Category (e.g., Appetizers)"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateMenuItem(index, "description", e.target.value)}
                          placeholder="Description"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-red"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? "Update Business" : "Create Business"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Sidebar */}
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
                      <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  {formData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.categories.slice(0, 3).map(cat => (
                        <span key={cat} className="px-2 py-1 text-xs bg-primary-red text-white rounded-full capitalize">
                          {cat.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900">{formData.name || "Business Name"}</h3>
                  
                  {formData.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">{formData.description}</p>
                  )}

                  {(formData.priceMin || formData.priceMax) && (
                    <p className="text-sm text-gray-500">
                      Price: PHP {formData.priceMin || "0"} - {formData.priceMax || "..."}
                    </p>
                  )}

                  {formData.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {[formData.brgy, formData.city].filter(Boolean).join(", ")}
                    </p>
                  )}

                  {formData.menuItems.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Menu Items ({formData.menuItems.length})</p>
                      <div className="space-y-1">
                        {formData.menuItems.slice(0, 3).map((item, i) => (
                          <div key={i} className="text-xs text-gray-600 flex justify-between">
                            <span>{item.name || "Untitled"}</span>
                            <span>PHP {item.price || "0"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 text-sm">Preview will appear here as you fill in the form</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

