import React from "react";
import type { Blog } from "../types/blog";
import BlogCard from "./BlogCard";

interface SectionProps {
  title: string;
  blogs: Blog[];
  description?: string;
  tone?: "light" | "muted" | "contrast";
  className?: string;
  id?: string;
}

const backgroundStyles: Record<NonNullable<SectionProps["tone"]>, string> = {
  light: "bg-white text-gray-900",
  muted: "bg-primary-red/5 text-gray-900",
  contrast: "bg-primary-red text-white",
};

const Section: React.FC<SectionProps> = ({
  title,
  blogs,
  description,
  tone = "light",
  className = "",
  id,
}) => {
  if (blogs.length === 0) {
    return null;
  }

  const wrapperClasses = `${backgroundStyles[tone]} py-20 ${className}`;
  const isContrast = tone === "contrast";

  return (
    <section id={id} className={wrapperClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={`mb-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              isContrast
                ? "bg-white/15 text-white"
                : "bg-primary-red/10 text-primary-red"
            }`}
          >
            TravelEase Picks
          </p>
          <h2
            className={`text-3xl font-bold sm:text-4xl ${
              isContrast ? "text-white" : "text-primary-red"
            }`}
          >
            {title}
          </h2>
          {description && (
            <p
              className={`mt-4 text-base sm:text-lg ${
                isContrast ? "text-white/90" : "text-gray-600"
              }`}
            >
              {description}
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.slice(0, 3).map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              variant={isContrast ? "dark" : "default"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Section;
