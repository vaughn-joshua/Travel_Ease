import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Carousel from "../component/blog/Carousel";
import Section from "../component/blog/Section";
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
    const pageTitle =
      "TravelEase Blogs | Explore Inspiring Travel Stories & Tips";
    const pageDescription =
      "Browse curated travel stories, expert planning advice, and client education from the TravelEase team. Discover new destinations and plan your next journey with confidence.";

    document.title = pageTitle;

    const existingMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );

    if (existingMeta) {
      existingMeta.content = pageDescription;
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = pageDescription;
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const featured = await blogApi.getFeaturedBlogs();
        setFeaturedBlogs(featured);

        const [destinations, tips, clientEducation] = await Promise.all([
          blogApi.getBlogs({ category: "Destinations", pageSize: 3 }),
          blogApi.getBlogs({ category: "Tips", pageSize: 3 }),
          blogApi.getBlogs({ category: "Client Education", pageSize: 3 }),
        ]);

        setDestinationsBlogs(destinations.items);
        setTipsBlogs(tips.items);
        setClientEducationBlogs(clientEducation.items);
      } catch (err: any) {
        console.error("Error fetching blogs:", err);

        if (err.response?.status === 500) {
          setError("Server error: Please try again later or contact support.");
        } else if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
          setError(
            "Cannot connect to server. Please check your connection and try again."
          );
        } else if (err.response?.status === 404) {
          setError("Blog data not found. Please try again later.");
        } else {
          setError("Failed to load blogs. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const structuredData = useMemo(() => {
    const combinedBlogs = [
      ...featuredBlogs,
      ...destinationsBlogs,
      ...tipsBlogs,
      ...clientEducationBlogs,
    ];

    if (combinedBlogs.length === 0) {
      return null;
    }

    const uniqueBlogs = combinedBlogs.filter(
      (blog, index, array) =>
        array.findIndex((item) => item.id === blog.id) === index
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
      description:
        "TravelEase curates inspiring travel stories, destination guides, and planning advice to help adventurers explore smarter.",
      blogPost: uniqueBlogs.slice(0, 8).map((blog) => ({
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        image: blog.coverImageUrl,
        author: {
          "@type": "Person",
          name: blog.author,
        },
        datePublished: blog.publishedAt,
        dateModified: blog.updatedAt,
        mainEntityOfPage: `${origin}/blogs/${blog.slug}`,
        timeRequired: `${blog.readingMinutes}M`,
      })),
      publisher: {
        "@type": "Organization",
        name: "TravelEase",
      },
    };
  }, [clientEducationBlogs, destinationsBlogs, featuredBlogs, tipsBlogs]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-base text-gray-600">
            Loading travel inspiration for you...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <p className="mb-4 font-medium text-red-600">{error}</p>
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
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80"
            alt="Traveler walking along a beach with waves at sunrise"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-48 right-12 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
          <div className="w-full max-w-3xl rounded-[30px] border border-white/25 bg-white/10 p-10 shadow-lg shadow-primary-red/20 backdrop-blur">
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
                TravelEase Magazine
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Explore Inspiring Travel Stories
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/90 sm:text-xl">
              Follow curated journeys, destination deep-dives, and actionable
              tips from travel experts. Every story is written to help you plan
              smarter, travel further, and savour the moments in between.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <a
                href="#featured-blogs"
                className="w-full max-w-xs rounded-full border border-white bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-red transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red sm:w-auto"
              >
                Start Exploring Blogs
              </a>
              <Link
                to="/blogs/new"
                className="w-full max-w-xs rounded-full border border-white/60 px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red sm:w-auto"
              >
                Share Your Story
              </Link>
            </div>
          </div>

          <dl className="grid w-full max-w-4xl grid-cols-1 gap-4 rounded-2xl border border-white/25 bg-white/15 p-8 text-left shadow-lg shadow-primary-red/10 backdrop-blur sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Expert Voices
              </dt>
              <dd className="text-2xl font-semibold text-white">
                25+ Contributors
              </dd>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Destinations Covered
              </dt>
              <dd className="text-2xl font-semibold text-white">60+ Cities</dd>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Weekly Readers
              </dt>
              <dd className="text-2xl font-semibold text-white">
                18k+ Travelers
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {featuredBlogs.length > 0 && (
        <Carousel
          id="featured-blogs"
          blogs={featuredBlogs}
          title="Featured Stories"
          description="Dive into handpicked adventures and timely guides from destinations we love right now."
          className="bg-primary-red"
        />
      )}

      {destinationsBlogs.length > 0 && (
        <Section
          id="destinations"
          title="Discover New Destinations"
          description="From hidden gems to iconic landmarks, these guides help you design unforgettable itineraries."
          blogs={destinationsBlogs}
          tone="light"
        />
      )}

      <section className="bg-primary-red text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Subscribe for Weekly Travel Insights
          </h2>
          <p className="max-w-2xl text-base text-white/90 sm:text-lg">
            Join thousands of explorers receiving curated itineraries, planning
            checklists, and stories that spark your next adventure - no spam,
            ever.
          </p>
          <form
            className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email"
              required
              className="w-full rounded-lg border border-white/30 bg-white/15 px-4 py-3 text-base text-white placeholder-gray-200 focus:border-white focus:outline-none focus:ring-2 focus:ring-white sm:max-w-md"
            />
            <button
              type="submit"
              className="w-full rounded-lg border border-white bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-red transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red sm:w-auto"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {tipsBlogs.length > 0 && (
        <Section
          id="travel-tips"
          title="Travel Smarter"
          description="Practical advice, packing lists, and booking strategies to maximize every trip."
          blogs={tipsBlogs}
          tone="muted"
        />
      )}

      {clientEducationBlogs.length > 0 && (
        <Section
          id="client-education"
          title="Client Education"
          description="Understand our process, learn from success stories, and see how TravelEase elevates your journeys."
          blogs={clientEducationBlogs}
          tone="light"
        />
      )}

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-primary-red sm:text-4xl">
            Plan Your Next Getaway with TravelEase
          </h2>
          <p className="max-w-2xl text-base text-gray-600 sm:text-lg">
            Tell us where you want to go and we&apos;ll pair you with tailored
            itineraries, vetted experiences, and expert support from start to
            finish.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <a href="/spots" className="btn-primary">
              Browse Featured Spots
            </a>
            <a href="/map" className="btn-secondary">
              Explore the Interactive Map
            </a>
          </div>
        </div>
      </section>

      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </main>
  );
}
