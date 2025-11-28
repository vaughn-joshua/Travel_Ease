import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { endpoints } from "../config/api.js";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Review {
  id: number;
  rating: number | null;
  content: string | null;
  date: string;
  user: { id: number; name: string } | null;
}

interface BusinessData {
  id: number;
  name: string;
  description: string | null;
  categories: { id: number; name: string }[];
  hours: Record<string, { open: string | null; close: string | null }>;
  priceRange: { min: number; max: number } | null;
  media: { cover: string | null; gallery: string[] };
  menuItems: MenuItem[];
  reviews: Review[];
  reviewCount: number;
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
    houseNumber: string | null;
    street: string | null;
    brgy: string | null;
    city: string | null;
  };
  rating: number | null;
  status: boolean;
  owner: { id: number; name: string; email: string } | null;
}

const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "gallery" | "reviews">("menu");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(endpoints.business.byId(id));
        if (!response.ok) throw new Error("Business not found");
        const data = await response.json();
        setBusiness(data);
      } catch (err) {
        setError("Business not found");
        console.error("Error fetching business:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id]);

  const formatTime = (time: string | null) => {
    if (!time) return "Closed";
    const [h, m] = time.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this business?")) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(endpoints.business.edit(id!), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete");
      navigate("/businesses");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete business");
    } finally {
      setDeleting(false);
    }
  };

  const formatCategoryName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto mb-4" />
          <p className="text-gray-600">Loading business...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Business Not Found</h1>
          <p className="text-gray-600 mb-8">The business you're looking for doesn't exist.</p>
          <Link to="/businesses" className="btn-primary">
            Back to Businesses
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = business.media?.cover ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={coverImage}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            {/* Category Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {business.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-block bg-primary-red text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  {formatCategoryName(cat.name)}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {business.name}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              {business.rating !== null && (
                <div className="flex items-center gap-1">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">{business.rating.toFixed(1)}</span>
                  <span className="text-white/70">({business.reviewCount} reviews)</span>
                </div>
              )}
              {business.priceRange && (
                <span>
                  ₱{business.priceRange.min} - ₱{business.priceRange.max}
                </span>
              )}
              {business.location.address && (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {business.location.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link
              to="/businesses"
              className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Businesses
            </Link>

            <div className="flex gap-3">
              <Link
                to={`/businesses/${id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-primary-red-dark transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {business.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">{business.description}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === "menu"
                      ? "text-primary-red border-b-2 border-primary-red"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Menu ({business.menuItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gallery")}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === "gallery"
                      ? "text-primary-red border-b-2 border-primary-red"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Gallery ({business.media.gallery.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === "reviews"
                      ? "text-primary-red border-b-2 border-primary-red"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Reviews ({business.reviewCount})
                </button>
              </div>

              <div className="p-6">
                {/* Menu Tab */}
                {activeTab === "menu" && (
                  <div>
                    {business.menuItems.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No menu items available</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {business.menuItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:border-primary-red/20 transition-colors"
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <span className="text-primary-red font-semibold whitespace-nowrap">
                                  ₱{item.price.toFixed(2)}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {item.category && (
                                <span className="inline-block text-xs text-gray-400 mt-2">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Gallery Tab */}
                {activeTab === "gallery" && (
                  <div>
                    {business.media.gallery.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No photos available</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {business.media.gallery.map((url, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setLightboxImage(url)}
                            className="aspect-square overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={url}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div>
                    {business.reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No reviews yet</p>
                    ) : (
                      <div className="space-y-4">
                        {business.reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {review.user?.name.charAt(0) || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {review.user?.name || "Anonymous"}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  {review.rating && (
                                    <span className="flex items-center gap-1">
                                      <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      {review.rating}
                                    </span>
                                  )}
                                  <span>{new Date(review.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            {review.content && (
                              <p className="text-gray-600 ml-13">{review.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hours */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
              <div className="space-y-2">
                {DAYS_ORDER.map((day) => {
                  const hours = business.hours[day];
                  const isOpen = hours?.open && hours?.close;
                  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
                  const isToday = day === today;

                  return (
                    <div
                      key={day}
                      className={`flex justify-between text-sm ${
                        isToday ? "font-medium text-primary-red" : "text-gray-600"
                      }`}
                    >
                      <span className="capitalize">{day}</span>
                      <span>
                        {isOpen
                          ? `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                          : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <p className="text-gray-600 text-sm">{business.location.address}</p>
              {business.location.lat && business.location.lng && (
                <a
                  href={`https://www.google.com/maps?q=${business.location.lat},${business.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center text-primary-red hover:text-primary-red-dark text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Google Maps
                </a>
              )}
            </div>

            {/* Owner Info */}
            {business.owner && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-red/10 rounded-full flex items-center justify-center">
                    <span className="text-primary-red font-semibold">
                      {business.owner.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{business.owner.name}</p>
                    <p className="text-sm text-gray-500">{business.owner.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
