import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Calendar, User, Lock, Globe } from "lucide-react";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import type { RSSFeedItem } from "../../../types/blog";

interface ScrapedCardProps {
  item: RSSFeedItem;
  isLoggedIn: boolean;
  className?: string;
}

/** Gradient placeholder shown when a card has no cover image */
const TRAVEL_GRADIENTS = [
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-red-600",
  "from-violet-400 via-purple-500 to-pink-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
];

function getGradient(title: string): string {
  // Deterministic gradient from title so it's stable across renders
  const idx = title.charCodeAt(0) % TRAVEL_GRADIENTS.length;
  return TRAVEL_GRADIENTS[idx];
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const ScrapedCard: React.FC<ScrapedCardProps> = ({
  item,
  isLoggedIn,
  className = "",
}) => {
  const gradient = getGradient(item.title);

  const cardContent = (
    <Card
      noPadding
      className={`h-full flex flex-col transition-colors duration-200 group-hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      {/* Cover image / gradient fallback */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 "
            onError={(e) => {
              // Fall back to gradient if image fails to load
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}
        {/* Gradient fallback (shown when no image, or image fails) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} items-center justify-center ${
            item.imageUrl ? "hidden" : "flex"
          }`}
        >
          <Globe className="w-12 h-12 text-white/60" />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Source badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-white/90 backdrop-blur-sm shadow-sm text-primary-red text-xs font-semibold">
            {item.sourceName}
          </Badge>
        </div>

        {/* External / Lock indicator */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm">
            {isLoggedIn ? (
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="flex h-full flex-col p-5 gap-3">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold leading-tight text-gray-900 group-hover:text-primary-red transition-colors line-clamp-2">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
              {item.excerpt}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3 pt-3 border-t border-gray-100">
          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[100px]">{item.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <time dateTime={item.pubDate}>{formatDate(item.pubDate)}</time>
            </div>
          </div>

          {/* CTA */}
          {isLoggedIn ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-primary-red group-hover:translate-x-1 transition-transform">
              Read Article
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-semibold text-gray-400">
              <Lock className="w-3.5 h-3.5" />
              Log in to read
            </span>
          )}
        </div>
      </div>
    </Card>
  );

  if (isLoggedIn) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block focus:outline-none"
        aria-label={`Read article: ${item.title} (opens in new tab)`}
      >
        {cardContent}
      </a>
    );
  }

  // Guest: clicking redirects to login with a descriptive title
  return (
    <Link
      to="/login"
      className="group block focus:outline-none"
      title="Log in to read this article"
      aria-label={`Log in to read: ${item.title}`}
    >
      {cardContent}
    </Link>
  );
};

export default ScrapedCard;
