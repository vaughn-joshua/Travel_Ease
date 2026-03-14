import React from "react";
import { Link } from "react-router-dom";
import type { Blog } from "../../types/blog";
import OptimizedImage from "../../components/OptimizedImage";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import { User, Calendar, Clock, ChevronRight } from "lucide-react";

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
      month: "short",
      day: "numeric",
    });
  };

  const isDark = variant === "dark";

  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className={`group block focus:outline-none ${className}`}
      aria-label={`Read blog post: ${blog.title}`}
    >
      <Card noPadding className={`h-full flex flex-col transition-all duration-300 group-hover:-translate-y-1 ${isDark ? 'bg-white/95 border-primary-red/20 shadow-lg shadow-primary-red/10' : 'hover:shadow-lg'}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <OptimizedImage
            src={blog.coverImageUrl}
            alt={blog.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-4 left-4 z-10">
            <Badge variant={isDark ? "error" : "default"} className="bg-white/90 backdrop-blur-sm shadow-sm text-primary-red">
              {blog.category}
            </Badge>
          </div>
        </div>

        <div className="flex h-full flex-col p-6 gap-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold leading-tight text-gray-900 group-hover:text-primary-red transition-colors line-clamp-2">
              {blog.title}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
              {blog.excerpt}
            </p>
          </div>

          <div className="mt-auto space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <time dateTime={blog.publishedAt}>
                  {formatDate(blog.publishedAt)}
                </time>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{blog.readingMinutes} min read</span>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-primary-red group-hover:translate-x-1 transition-transform">
                Read More
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default BlogCard;
