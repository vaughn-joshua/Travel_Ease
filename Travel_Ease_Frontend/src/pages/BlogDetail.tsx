import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogApi } from "../services/api";
import type { Blog } from "../types/blog";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const blogData = await blogApi.getBlogBySlug(slug);
        setBlog(blogData);
      } catch (err) {
        setError("Blog not found");
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!blog || !blog.id) {
      console.error("Blog or blog.id is missing:", blog);
      alert("Cannot delete: Blog information is missing.");
      return;
    }
    
    setDeleting(true);
    
    try {
      console.log("Deleting blog with ID:", blog.id);
      await blogApi.deleteBlog(blog.id);
      console.log("Blog deleted successfully");
      navigate("/blogs");
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          "Failed to delete blog post. Please try again.";
      alert(errorMessage);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blog Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The blog post you're looking for doesn't exist.
          </p>
          <Link to="/blogs" className="btn-primary">
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/blogs"
              className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blogs
            </Link>
            
            <div className="flex gap-3">
              <Link
                to={`/blogs/${slug}/edit`}
                className="inline-flex items-center px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-primary-red-dark transition-colors duration-200 text-sm font-medium"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Link>
              <button
                type="button"
                onClick={() => {
                  console.log("Delete button clicked, blog:", blog);
                  if (!blog || !blog.id) {
                    console.error("Cannot delete: blog or blog.id is missing");
                    alert("Cannot delete: Blog information is missing.");
                    return;
                  }
                  setShowDeleteConfirm(true);
                }}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
          
          {showDeleteConfirm && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Confirm Delete</h3>
              <p className="text-red-800 mb-4">
                Are you sure you want to delete this blog post? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="text-center">
            <span className="inline-block bg-primary-red text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
              {blog.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {blog.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {blog.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex items-center justify-center space-x-6 text-gray-500">
              <div className="flex items-center space-x-2">
                <span className="font-medium">By {blog.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <time dateTime={blog.publishedAt}>
                  {formatDate(blog.publishedAt)}
                </time>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>{blog.readingMinutes} min read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div
            dangerouslySetInnerHTML={{ __html: blog.content }}
            className="text-gray-800 leading-relaxed"
          />
        </div>

        {/* Back to Blogs Button */}
        <div className="mt-12 text-center">
          <Link to="/blogs" className="btn-primary">
            Read More Blogs
          </Link>
        </div>
      </div>
    </div>
  );
}
