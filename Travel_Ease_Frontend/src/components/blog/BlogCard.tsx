import React from "react";
import { Link } from "react-router-dom";
import type { Blog } from "../../types/blog";
import OptimizedImage from "../../components/OptimizedImage";

interface BlogCardProps {
  blog: Blog;
  className?: string;
  variant?: "default" | "dark";
}

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  className = "",
  variant = "default",
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isDark = variant === "dark";

  const cardBase =
    "flex h-full flex-col overflow-hidden rounded-3xl border transition duration-300 ease-out";
  const cardStyles = isDark
    ? "border-primary-red/20 bg-white/95 text-gray-900 shadow-lg shadow-primary-red/10 backdrop-blur hover:-translate-y-1 hover:border-primary-red/40"
    : "border-primary-red/10 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl";

  const titleColor = "text-gray-900 group-hover:text-primary-red";
  const bodyColor = "text-gray-600";
  const metaColor = "text-gray-500";

  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className={`group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-4 ${
        isDark
          ? "focus-visible:ring-offset-primary-red"
          : "focus-visible:ring-offset-white"
      } ${className}`}
      aria-label={`Read blog post: ${blog.title}`}
    >
      <article className={`${cardBase} ${cardStyles}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <OptimizedImage
            src={blog.coverImageUrl}
            alt={blog.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-70 transition duration-500 group-hover:opacity-80 pointer-events-none"
            aria-hidden="true"
          />
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] z-10 ${
              isDark
                ? "bg-primary-red text-white"
                : "bg-primary-red/10 text-primary-red"
            }`}
          >
            {blog.category}
          </span>
        </div>

        <div className="flex h-full flex-col gap-4 p-6">
          <div className="space-y-3">
            <h3 className={`text-xl font-semibold leading-tight ${titleColor}`}>
              {blog.title}
            </h3>
            <p className={`text-sm leading-relaxed line-clamp-3 ${bodyColor}`}>
              {blog.excerpt}
            </p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className={`flex items-center gap-2 ${metaColor}`}>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>By {blog.author}</span>
              </div>

              <time
                className={`${metaColor}`}
                dateTime={blog.publishedAt}
                aria-label={`Published on ${formatDate(blog.publishedAt)}`}
              >
                {formatDate(blog.publishedAt)}
              </time>
            </div>

            <div
              className={`flex items-center justify-between border-t pt-4 text-sm ${
                isDark ? "border-primary-red/20" : "border-primary-red/10"
              }`}
            >
              <span className={`${metaColor}`}>
                {blog.readingMinutes} min read
              </span>
              <span className="flex items-center gap-2 font-medium text-primary-red transition group-hover:gap-3">
                Read More
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
