import React, { useState, useRef, useEffect } from "react";

/**
 * OptimizedImage Component
 * 
 * A performance-optimized image component with:
 * - Blur placeholder during loading
 * - Responsive srcset for different screen sizes
 * - Lazy loading with Intersection Observer
 * - Smooth fade-in transition when loaded
 * - Error fallback handling
 * 
 * @example
 * <OptimizedImage
 *   src="https://images.unsplash.com/photo-123?w=800"
 *   alt="Beautiful landscape"
 *   className="w-full h-64 object-cover"
 *   sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
 * />
 */

interface OptimizedImageProps {
  /** Image source URL (should be an Unsplash URL or similar that supports width params) */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Aspect ratio class (e.g., "aspect-video", "aspect-[4/3]") */
  aspectRatio?: string;
  /** Whether to use lazy loading (default: true) */
  lazy?: boolean;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Priority loading (disables lazy loading) */
  priority?: boolean;
}

/**
 * Generate srcset for Unsplash images
 * Unsplash supports dynamic resizing via URL parameters
 */
function generateSrcSet(src: string): string {
  // Check if it's an Unsplash URL
  if (!src.includes("unsplash.com")) {
    return "";
  }

  // Remove existing width parameter
  const baseUrl = src.replace(/[?&]w=\d+/g, "").replace(/[?&]q=\d+/g, "");
  const separator = baseUrl.includes("?") ? "&" : "?";

  // Generate srcset for common breakpoints
  const widths = [400, 600, 800, 1200, 1600];
  return widths
    .map((w) => `${baseUrl}${separator}w=${w}&q=75 ${w}w`)
    .join(", ");
}

/**
 * Generate a tiny blur placeholder URL
 */
function generateBlurUrl(src: string): string {
  if (!src.includes("unsplash.com")) {
    return "";
  }

  // Get a tiny version for blur placeholder
  const baseUrl = src.replace(/[?&]w=\d+/g, "").replace(/[?&]q=\d+/g, "");
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}w=20&q=10`;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  aspectRatio,
  lazy = true,
  onLoad,
  onError,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate optimized URLs
  const srcSet = generateSrcSet(src);
  const blurUrl = generateBlurUrl(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !lazy) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${aspectRatio || ""}`}
    >
      {/* Blur placeholder background */}
      {blurUrl && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-lg scale-110 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${blurUrl})`,
            opacity: isLoaded ? 0 : 1,
          }}
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Image unavailable</span>
          </div>
        </div>
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet || undefined}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          className={`transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
};

export default OptimizedImage;

