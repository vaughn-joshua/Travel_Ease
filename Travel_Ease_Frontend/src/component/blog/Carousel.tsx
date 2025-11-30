import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Blog } from "../../types/blog";
import BlogCard from "./BlogCard";

interface CarouselProps {
  blogs: Blog[];
  title: string;
  description?: string;
  className?: string;
  id?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  blogs,
  title,
  description,
  className = "",
  id,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, blogs.length - itemsPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (carouselRef.current?.contains(document.activeElement)) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          prevSlide();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          nextSlide();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [maxIndex, nextSlide, prevSlide]);

  if (blogs.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      className={`relative overflow-hidden py-20 text-white ${className}`}
    >
      <div className="absolute inset-0 bg-primary-red/90" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Featured Collection
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
          {description && (
            <p className="mt-4 text-base text-white/90 sm:text-lg">
              {description}
            </p>
          )}
        </div>

        <div className="relative mt-12" ref={carouselRef}>
          <div className="overflow-hidden" aria-live="polite">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / itemsPerView)
                }%)`,
              }}
            >
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="flex-shrink-0 px-4"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <BlogCard variant="dark" blog={blog} />
                </div>
              ))}
            </div>
          </div>

          {blogs.length > itemsPerView && (
            <>
              <button
                onClick={prevSlide}
                className="group absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 -translate-x-4 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-red"
                aria-label="Previous slide"
              >
                <svg
                  className="h-6 w-6 text-primary-red transition group-hover:translate-x-[-2px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="group absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-red"
                aria-label="Next slide"
              >
                <svg
                  className="h-6 w-6 text-primary-red transition group-hover:translate-x-[2px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {blogs.length > itemsPerView && (
            <div className="mt-10 flex justify-center space-x-2">
              {Array.from({ length: maxIndex + 1 }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-10 rounded-full transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-red ${
                    index === currentIndex
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Carousel;
