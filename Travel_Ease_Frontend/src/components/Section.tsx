import React from "react";
import type { Blog } from "../types/blog";
import BlogCard from "./BlogCard";

interface SectionProps {
  title: string;
  blogs: Blog[];
  backgroundColor?: "white" | "red";
  className?: string;
}

const Section: React.FC<SectionProps> = ({
  title,
  blogs,
  backgroundColor = "white",
  className = "",
}) => {
  const bgClass = backgroundColor === "red" ? "bg-primary-red" : "bg-white";
  const titleClass =
    backgroundColor === "red" ? "text-white" : "text-secondary-blue";

  return (
    <section className={`py-16 ${bgClass} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`text-3xl font-bold text-center mb-12 ${titleClass}`}>
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.slice(0, 3).map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Section;


