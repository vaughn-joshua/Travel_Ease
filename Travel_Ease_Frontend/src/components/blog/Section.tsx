import React from "react";
import type { Blog } from "../../types/blog";
import BlogCard from "./BlogCard";
import { Sparkles } from "lucide-react";

interface SectionProps {
  title: string;
  blogs: Blog[];
  description?: string;
  tone?: "light" | "muted" | "contrast";
  className?: string;
  id?: string;
}

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

  const bgColors = {
    light: "bg-white",
    muted: "bg-gray-50",
    contrast: "bg-primary-red text-white",
  };

  const isContrast = tone === "contrast";

  return (
    <section id={id} className={`${bgColors[tone]} py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className={`inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 ${
            isContrast ? "bg-white/10 text-white" : "bg-primary-red/10 text-primary-red"
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>TravelEase Picks</span>
          </div>
          
          <h2 className={`text-3xl font-bold sm:text-4xl mb-6 ${isContrast ? "text-white" : "text-gray-900"}`}>
            {title}
          </h2>
          
          {description && (
            <p className={`text-lg leading-relaxed ${isContrast ? "text-white/90" : "text-gray-600"}`}>
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
