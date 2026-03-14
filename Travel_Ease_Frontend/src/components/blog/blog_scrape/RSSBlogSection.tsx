import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Rss, Lock, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useRSSFeed } from "../../../features/blogs/useRSSFeed";
import ScrapedCard from "./ScrapedCard";
import Button from "../../ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedConfig {
  label: string;
  url: string;
}

interface RSSBlogSectionProps {
  feedUrls: FeedConfig[];
  title?: string;
  description?: string;
  itemsPerFeed?: number;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="flex justify-between pt-3 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

// ─── Single Feed Panel ────────────────────────────────────────────────────────

interface FeedPanelProps {
  feed: FeedConfig;
  itemsPerFeed: number;
}

const FeedPanel: React.FC<FeedPanelProps> = ({ feed, itemsPerFeed }) => {
  const { data, isLoading, isError, error, refetch } = useRSSFeed(
    feed.url,
    itemsPerFeed
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: itemsPerFeed }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-gray-300" />
        <div>
          <p className="font-medium text-gray-600">
            Couldn't load articles from {feed.label}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {(error as Error)?.message || "Unknown error"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <Rss className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500 font-medium">No articles found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <ScrapedCard key={`${item.link}-${idx}`} item={item} isLoggedIn={true} />
      ))}
    </div>
  );
};

// ─── Auth-Gate Teaser ─────────────────────────────────────────────────────────

const GuestTeaser: React.FC = () => (
  <div className="relative">
    {/* Blurred ghost cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 select-none pointer-events-none">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border border-gray-100 shadow-sm blur-sm opacity-60"
        >
          <div
            className={`aspect-[4/3] ${
              ["bg-gradient-to-br from-sky-300 to-indigo-400",
               "bg-gradient-to-br from-emerald-300 to-teal-500",
               "bg-gradient-to-br from-amber-300 to-orange-500"][i]
            }`}
          />
          <div className="p-5 space-y-3 bg-white">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>

    {/* Overlay CTA */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 text-center max-w-sm mx-4">
        <div className="w-14 h-14 rounded-full bg-primary-red/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary-red" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Members Only Content
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Log in to unlock curated travel articles from blogs around the world.
        </p>
        <Link to="/login">
          <Button className="w-full">Log In to Read</Button>
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary-red hover:underline font-medium"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const RSSBlogSection: React.FC<RSSBlogSectionProps> = ({
  feedUrls,
  title = "Travel Insights from the Web",
  description = "Curated articles handpicked from top travel blogs around the world.",
  itemsPerFeed = 6,
}) => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [activeTab, setActiveTab] = useState(0);
  const activeFeed = feedUrls[activeTab];

  if (!feedUrls || feedUrls.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50" aria-labelledby="rss-section-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-red/10 text-primary-red text-xs font-bold uppercase tracking-wider mb-3">
              <Rss className="w-3.5 h-3.5" />
              <span>Live from the Web</span>
            </div>
            <h2
              id="rss-section-title"
              className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
            >
              {title}
            </h2>
            <p className="mt-2 text-gray-500 text-base max-w-xl">
              {description}
            </p>
          </div>

          {/* Auth indicator for guests */}
          {!isLoggedIn && (
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Lock className="w-4 h-4" />}
                className="shrink-0"
              >
                Log in to read
              </Button>
            </Link>
          )}
        </div>

        {/* Feed tabs (only shown when multiple feeds) */}
        {feedUrls.length > 1 && isLoggedIn && (
          <div className="flex flex-wrap gap-2 mb-8">
            {feedUrls.map((feed, i) => (
              <button
                key={feed.url}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === i
                    ? "bg-primary-red text-white shadow-sm shadow-primary-red/30"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-primary-red hover:text-primary-red"
                }`}
              >
                {feed.label}
              </button>
            ))}
          </div>
        )}

        {/* Content: auth-gated */}
        {isLoggedIn ? (
          <FeedPanel feed={activeFeed} itemsPerFeed={itemsPerFeed} />
        ) : (
          <GuestTeaser />
        )}
      </div>
    </section>
  );
};

export default RSSBlogSection;
