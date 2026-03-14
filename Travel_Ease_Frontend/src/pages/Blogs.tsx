import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Carousel from "../components/blog/Carousel";
import Section from "../components/blog/Section";
import { useBlogOverview } from "../features/blogs/queries";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { ArrowRight, Map as MapIcon, PenTool, Loader2 } from "lucide-react";
import MapPreview from "../components/blog/MapPreview";
import RSSBlogSection from "../components/blog/blog_scrape/RSSBlogSection";

export default function Blogs() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
  } = useBlogOverview();

  useEffect(() => {
    const pageTitle = "TravelEase | Explore Inspiring Travel Stories & Tips";
    const pageDescription =
      "Browse curated travel stories, expert planning advice, and client education. Discover new destinations and plan your next journey with confidence.";
    document.title = pageTitle;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = pageDescription;
  }, []);

  const featuredBlogs = overview?.featured ?? [];
  const destinationsBlogs = overview?.destinations ?? [];
  const tipsBlogs = overview?.tips ?? [];
  const clientEducationBlogs = overview?.clientEducation ?? [];

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    const err = error as any;
    return err.message || "Failed to load blogs. Please try again later.";
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-red" />
          <p className="text-sm text-gray-500 font-medium">Loading travel inspiration...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <p className="mb-6 font-medium text-gray-900">{errorMessage}</p>
          <Button onClick={() => refetch()} variant="outline">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans pb-24">
      {/* Clean Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-100">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 mb-6">
            <span className="text-xs font-semibold text-gray-600 tracking-wider uppercase">
              TravelEase Magazine
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Explore the World, <br />
            One Story at a Time
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
            Discover curated journeys, expert planning tips, and hidden gems. 
            Your next great adventure starts with a single step.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to={isLoggedIn ? "/plans" : "/signup"}>
              <Button size="lg" className="w-full sm:w-auto">
                Start Planning
              </Button>
            </Link>
            <Link to="/businesses">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Stories</h2>
          <p className="text-gray-600 max-w-2xl">
            Handpicked narratives and essential guides from our travel strategists.
          </p>
        </div>
        <Carousel items={featuredBlogs} />
      </section>

      {/* Web Stories (RSS) */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Live From The Web</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Travel News & Updates</h2>
            <p className="text-gray-600 max-w-2xl">
              The latest trends, stories, and news from across the global travel community.
            </p>
          </div>
          <RSSBlogSection />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Destinations</h2>
          <Section title="" items={destinationsBlogs} limit={4} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Travel Tips</h2>
          <Section title="" items={tipsBlogs} limit={4} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Guides & Resources</h2>
          <Section title="" items={clientEducationBlogs} limit={4} />
        </div>
      </section>

      {/* Map Integration CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-center justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Find These Spots on the Map
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Every destination we write about is mapped and ready for your itinerary. 
              Switch to map view to explore locations visually.
            </p>
            <Link to="/map">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Open Map View
              </Button>
            </Link>
          </div>
          <div className="w-full lg:w-1/2 aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 border border-gray-800 shadow-2xl">
            <MapPreview />
          </div>
        </div>
      </section>
    </main>
  );
}
