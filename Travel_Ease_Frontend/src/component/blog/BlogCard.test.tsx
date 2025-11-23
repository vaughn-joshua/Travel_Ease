import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BlogCard from "../../components/BlogCard";
import type { Blog } from "../../../types/blog";

const mockBlog: Blog = {
  id: "1",
  title: "Test Blog Post",
  slug: "test-blog-post",
  excerpt: "This is a test blog post excerpt that describes the content.",
  content: "<p>This is the full content of the blog post.</p>",
  coverImageUrl: "https://example.com/image.jpg",
  category: "Destinations",
  isFeatured: false,
  readingMinutes: 5,
  publishedAt: "2024-01-15T00:00:00Z",
  author: "Test Author",
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z",
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("BlogCard", () => {
  it("renders blog title and meta information", () => {
    renderWithRouter(<BlogCard blog={mockBlog} />);

    expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is a test blog post excerpt that describes the content."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/By Test Author/i)).toBeInTheDocument();
    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders the cover image with correct alt text", () => {
    renderWithRouter(<BlogCard blog={mockBlog} />);

    const image = screen.getByAltText("Test Blog Post");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("links to the correct blog detail page", () => {
    renderWithRouter(<BlogCard blog={mockBlog} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blogs/test-blog-post");
  });

  it("has proper accessibility attributes", () => {
    renderWithRouter(<BlogCard blog={mockBlog} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "aria-label",
      "Read blog post: Test Blog Post"
    );
  });
});
