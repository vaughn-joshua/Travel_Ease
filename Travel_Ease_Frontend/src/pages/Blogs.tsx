import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import Carousel from "../components/Carousel";
import Section from "../components/Section";
import { blogApi } from "../services/api";
import type { Blog } from "../types/blog";

export default function Blogs() {
  const [featuredBlogs, setFeaturedBlogs] = useState<Blog[]>([]);
  const [destinationsBlogs, setDestinationsBlogs] = useState<Blog[]>([]);
  const [tipsBlogs, setTipsBlogs] = useState<Blog[]>([]);
  const [clientEducationBlogs, setClientEducationBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);

        // Fetch featured blogs
        const featured = await blogApi.getFeaturedBlogs();
        setFeaturedBlogs(featured);

        // Fetch blogs by category
        const [destinations, tips, clientEducation] = await Promise.all([
          blogApi.getBlogs({ category: "Destinations", pageSize: 3 }),
          blogApi.getBlogs({ category: "Tips", pageSize: 3 }),
          blogApi.getBlogs({ category: "Client Education", pageSize: 3 }),
        ]);

        setDestinationsBlogs(destinations.items);
        setTipsBlogs(tips.items);
        setClientEducationBlogs(clientEducation.items);
      } catch (err) {
        setError("Failed to load blogs");
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blogs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <PageHeader
        title="Blogs"
        subtitle="Discover amazing destinations, travel tips, and insights to make your next adventure unforgettable"
      />

      {/* Featured Carousel */}
      {featuredBlogs.length > 0 && (
        <Carousel
          blogs={featuredBlogs}
          title="Featured Stories"
          className="bg-primary-red"
        />
      )}

      {/* Destinations Section */}
      {destinationsBlogs.length > 0 && (
        <Section
          title="Destinations"
          blogs={destinationsBlogs}
          backgroundColor="white"
        />
      )}

      {/* Tips Section */}
      {tipsBlogs.length > 0 && (
        <Section title="Travel Tips" blogs={tipsBlogs} backgroundColor="red" />
      )}

      {/* Client Education Section */}
      {clientEducationBlogs.length > 0 && (
        <Section
          title="Client Education"
          blogs={clientEducationBlogs}
          backgroundColor="white"
        />
      )}
    </div>
  );
}
