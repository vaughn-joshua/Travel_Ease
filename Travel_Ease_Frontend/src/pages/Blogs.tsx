import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Carousel from "../components/blog/Carousel";
import Section from "../components/blog/Section";
import { useBlogList, useBlogOverview } from "../features/blogs/queries";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { ArrowRight, Map as MapIcon, PenTool, Loader2 } from "lucide-react";
import MapPreview from "../components/blog/MapPreview";
import RSSBlogSection from "../components/blog/blog_scrape/RSSBlogSection";
import BlogCard from "../components/blog/BlogCard";
import ScrapedCard from "../components/blog/blog_scrape/ScrapedCard";
import { useRSSFeed } from "../features/blogs/useRSSFeed";

const LOGGED_IN_FEEDS = [
  {
    label: "Tagaytay Escapes",
    url: "https://thepoortraveler.net/category/tagaytay/feed/",
  },
  {
    label: "PH Travel Picks",
    url: "https://thepoortraveler.net/feed/",
  },
  {
    label: "Island Adventures",
    url: "https://www.filipinotravel.com.ph/feed/",
  },
] as const;

export default function Blogs() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [sourceCategory, setSourceCategory] = useState<
    "both" | "fetched" | "database"
  >("both");

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useBlogOverview();

  const { data: blogListData, isLoading: dbBlogsLoading } = useBlogList({
    page: 1,
    pageSize: 50,
  });

  const { data: fetchedTagaytay, isLoading: fetchedTagaytayLoading } =
    useRSSFeed(isLoggedIn ? LOGGED_IN_FEEDS[0].url : "", 6);
  const { data: fetchedPhTravel, isLoading: fetchedPhTravelLoading } =
    useRSSFeed(isLoggedIn ? LOGGED_IN_FEEDS[1].url : "", 6);
  const { data: fetchedIsland, isLoading: fetchedIslandLoading } = useRSSFeed(
    isLoggedIn ? LOGGED_IN_FEEDS[2].url : "",
    6,
  );

  useEffect(() => {
    const pageTitle = "TravelEase | Explore Inspiring Travel Stories & Tips";
    const pageDescription =
      "Browse curated travel stories, expert planning advice, and client education. Discover new destinations and plan your next journey with confidence.";
    document.title = pageTitle;

    // Simple meta update (omitted detailed check for brevity but kept functionality)
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
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
  const databaseBlogs = useMemo(() => {
    const fromList = blogListData?.items ?? [];
    if (fromList.length > 0) {
      return fromList;
    }

    const fromOverview = [
      ...featuredBlogs,
      ...destinationsBlogs,
      ...tipsBlogs,
      ...clientEducationBlogs,
    ];

    return fromOverview.filter(
      (blog, index, array) =>
        array.findIndex((item) => item.id === blog.id) === index,
    );
  }, [
    blogListData?.items,
    featuredBlogs,
    destinationsBlogs,
    tipsBlogs,
    clientEducationBlogs,
  ]);

  const fetchedBlogs = useMemo(() => {
    const allFetched = [
      ...(fetchedTagaytay?.items ?? []),
      ...(fetchedPhTravel?.items ?? []),
      ...(fetchedIsland?.items ?? []),
    ];

    return allFetched
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => entry.link === item.link) === index,
      )
      .sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
      )
      .slice(0, 12);
  }, [fetchedTagaytay?.items, fetchedPhTravel?.items, fetchedIsland?.items]);

  const fetchedLoading =
    fetchedTagaytayLoading || fetchedPhTravelLoading || fetchedIslandLoading;

  const dbEntries = useMemo(
    () =>
      [...databaseBlogs]
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime(),
        )
        .map((blog) => ({
          type: "database" as const,
          dateValue: new Date(blog.publishedAt).getTime() || 0,
          blog,
        })),
    [databaseBlogs],
  );

  const fetchedEntries = useMemo(
    () =>
      [...fetchedBlogs]
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        )
        .map((item) => ({
          type: "fetched" as const,
          dateValue: new Date(item.pubDate).getTime() || 0,
          item,
        })),
    [fetchedBlogs],
  );

  const mergedStories = useMemo(() => {
    if (dbEntries.length === 0) {
      return fetchedEntries.slice(0, 8);
    }

    const limitedFetched = fetchedEntries.slice(0, dbEntries.length);
    const interleaved: Array<
      (typeof dbEntries)[number] | (typeof fetchedEntries)[number]
    > = [];
    const longest = Math.max(dbEntries.length, limitedFetched.length);

    for (let index = 0; index < longest; index += 1) {
      if (dbEntries[index]) {
        interleaved.push(dbEntries[index]);
      }
      if (limitedFetched[index]) {
        interleaved.push(limitedFetched[index]);
      }
    }

    return interleaved;
  }, [dbEntries, fetchedEntries]);

  const visibleStories = useMemo(() => {
    if (sourceCategory === "database") {
      return dbEntries;
    }
    if (sourceCategory === "fetched") {
      return fetchedEntries;
    }
    return mergedStories;
  }, [dbEntries, fetchedEntries, mergedStories, sourceCategory]);

  const structuredData = useMemo(() => {
    // ... (Keep existing structured data logic)
    // For brevity, using the same logic as before
    const combinedBlogs = [
      ...featuredBlogs,
      ...destinationsBlogs,
      ...tipsBlogs,
      ...clientEducationBlogs,
    ];

    if (combinedBlogs.length === 0) return null;

    const uniqueBlogs = combinedBlogs.filter(
      (blog, index, array) =>
        array.findIndex((item) => item.id === blog.id) === index,
    );

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://travelsease.example.com";

    return {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "TravelEase Blogs",
      url: `${origin}/blogs`,
      description: "TravelEase curates inspiring travel stories.",
      blogPost: uniqueBlogs.slice(0, 8).map((blog) => ({
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        image: blog.coverImageUrl,
        author: { "@type": "Person", name: blog.author },
        datePublished: blog.publishedAt,
        dateModified: blog.updatedAt,
        mainEntityOfPage: `${origin}/blogs/${blog.slug}`,
      })),
      publisher: { "@type": "Organization", name: "TravelEase" },
    };
  }, [clientEducationBlogs, destinationsBlogs, featuredBlogs, tipsBlogs]);

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    const err = error as any;
    // ... (Keep existing error message logic)
    return err.message || "Failed to load blogs. Please try again later.";
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-red" />
          <p className="text-base text-gray-600 font-medium">
            Loading travel inspiration...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <p className="mb-6 font-medium text-red-600">{errorMessage}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1604237233847-0cd10a179521?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGFnYXl0YXl8ZW58MHx8MHx8fDA%3D"
            alt="Scenic travel landscape"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-primary-red animate-pulse" />
              <span className="text-sm font-medium text-white tracking-wide uppercase">
                TravelEase Magazine
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg">
              Explore the World, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                One Story at a Time
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-200 leading-relaxed drop-shadow-md">
              Discover curated journeys, expert planning tips, and hidden gems.
              Your next great adventure starts with a single step.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to={isLoggedIn ? "/plans" : "/signup"}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[180px] shadow-xl shadow-primary-red/20"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {isLoggedIn ? "Start Planning" : "Start Your Journey"}
                </Button>
              </Link>
              <Link to="/blogs/new">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[180px] border-white text-white hover:bg-white hover:text-gray-900 shadow-lg"
                  leftIcon={<PenTool className="w-4 h-4" />}
                >
                  Write a Story
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <svg
            className="w-6 h-6 text-white/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Logged-in custom blog layout */}
      {isLoggedIn && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Discover Tagaytay & Beyond
                </h2>
                <p className="mt-2 text-gray-600">
                  Explore local community stories and curated travel reads in
                  one place.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  onClick={() => setSourceCategory("both")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    sourceCategory === "both"
                      ? "bg-primary-red text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-primary-red hover:text-primary-red"
                  }`}
                >
                  All Stories
                </button>
                <button
                  onClick={() => setSourceCategory("database")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    sourceCategory === "database"
                      ? "bg-primary-red text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-primary-red hover:text-primary-red"
                  }`}
                >
                  Database
                </button>
                <button
                  onClick={() => setSourceCategory("fetched")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    sourceCategory === "fetched"
                      ? "bg-primary-red text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-primary-red hover:text-primary-red"
                  }`}
                >
                  Web
                </button>

                <Link to="/blogs/new" className="ml-1">
                  <Button size="sm" leftIcon={<PenTool className="w-4 h-4" />}>
                    Write Story
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="h-6 w-1.5 rounded-full bg-primary-red" />
                <h3 className="text-xl font-bold text-gray-900">All Stories</h3>
              </div>
              <p className="text-sm font-medium text-gray-500">
                {visibleStories.length}{" "}
                {visibleStories.length === 1 ? "story" : "stories"}
              </p>
            </div>

            {(dbBlogsLoading || fetchedLoading) && (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-600">
                <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-primary-red" />
                Loading stories...
              </div>
            )}

            {!dbBlogsLoading &&
              !fetchedLoading &&
              visibleStories.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-600">
                  No stories available for this source yet.
                </div>
              )}

            {!dbBlogsLoading &&
              !fetchedLoading &&
              visibleStories.length > 0 && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleStories.map((entry) =>
                    entry.type === "database" ? (
                      <BlogCard
                        key={`db-${entry.blog.id}`}
                        blog={entry.blog}
                        variant="default"
                      />
                    ) : (
                      <ScrapedCard
                        key={`web-${entry.item.link}`}
                        item={entry.item}
                        isLoggedIn={isLoggedIn}
                      />
                    ),
                  )}
                </div>
              )}
          </div>
        </section>
      )}

      {/* Featured Carousel */}
      {!isLoggedIn && featuredBlogs.length > 0 && (
        <Carousel
          id="featured-blogs"
          blogs={featuredBlogs}
          title="Featured Stories"
          description="Handpicked adventures and timely guides from our editors."
          className="bg-gray-900"
        />
      )}

      {/* Destinations Grid */}
      {destinationsBlogs.length > 0 && (
        <Section
          id="destinations"
          title="Destinations"
          description="From hidden gems to iconic landmarks, find your perfect getaway."
          blogs={destinationsBlogs}
          tone="light"
        />
      )}

      {/* Newsletter Section */}
      {!isLoggedIn && (
        <section className="bg-primary-red py-24 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold sm:text-4xl mb-6">
              Get Weekly Travel Inspiration
            </h2>
            <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
              Join 18,000+ explorers. Receive curated itineraries, planning
              hacks, and exclusive deals delivered straight to your inbox.
            </p>

            <form
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 rounded-lg px-5 py-3.5 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                required
              />
              <Button
                variant="secondary"
                className="bg-gray-900 text-white hover:bg-gray-800 border-none shadow-lg py-3.5"
              >
                Subscribe
              </Button>
            </form>
            <p className="mt-4 text-sm text-white/60">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </section>
      )}

      {/* Travel Tips */}
      {tipsBlogs.length > 0 && (
        <Section
          id="travel-tips"
          title="Travel Smarter"
          description="Expert advice, packing lists, and strategies to maximize every trip."
          blogs={tipsBlogs}
          tone="muted"
        />
      )}

      {/* RSS Blog Section — Tagaytay & Philippines blogs (auth-gated) */}
      {!isLoggedIn && (
        <RSSBlogSection
          title="Discover Tagaytay & the Philippines"
          description="Fresh travel guides and tips from top Philippine travel blogs — Tagaytay first."
          itemsPerFeed={6}
          feedUrls={[
            {
              // Priority 1 — Tagaytay category feed (all posts are about Tagaytay)
              label: "Tagaytay Guide",
              url: "https://thepoortraveler.net/category/tagaytay/feed/",
            },
            {
              // Priority 2 — The Poor Traveler main Philippines travel feed
              label: "PH Travel Guide",
              url: "https://thepoortraveler.net/feed/",
            },
            {
              // Priority 3 — Philippines tours blog (includes South Luzon / Taal area)
              label: "Philippines Tours",
              url: "https://www.filipinotravel.com.ph/feed/",
            },
          ]}
        />
      )}

      {/* Map Preview Section */}
      {!isLoggedIn && (
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 space-y-4">
                <MapPreview />
                <p className="text-xs text-gray-500">
                  Explore the latest accommodations, restaurants, and
                  attractions around Tagaytay. Pins update as new businesses
                  join TravelEase.
                </p>
              </div>

              <div className="order-1 lg:order-2 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Interactive Map</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                  Discover Local Favorites & <br /> Hidden Gems
                </h2>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Explore our interactive map to find the best restaurants,
                  attractions, and accommodations. Click on any pin to see
                  ratings, reviews, and more details.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link to="/map">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto"
                      leftIcon={<MapIcon className="w-4 h-4" />}
                    >
                      Open Full Map
                    </Button>
                  </Link>
                  <Link to="/travel_spots_page">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Browse All Spots
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </main>
  );
}
