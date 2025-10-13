import React from "react";
import { Link } from "react-router-dom";
import type { Blog } from "../types/blog";

interface BlogCardProps {
  blog: Blog;
  className?: string;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, className = "" }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className={`block group ${className}`}
      aria-label={`Read blog post: ${blog.title}`}
    >
      <article className="card p-0 overflow-hidden h-full">
        {/* Image */}
        <div className="aspect-square bg-gray-200 overflow-hidden">
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-red transition-colors duration-200">
            {blog.title}
          </h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {blog.excerpt}
          </p>

          {/* Meta Row */}
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <time className="text-sm text-gray-500" dateTime={blog.publishedAt}>
              {formatDate(blog.publishedAt)}
            </time>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-500">
                {blog.readingMinutes} min read
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;


