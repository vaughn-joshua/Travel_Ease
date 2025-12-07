import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBlogDetail } from "../features/blogs/queries";
import { useUpdateBlog, useDeleteBlog } from "../features/blogs/mutations";
import { generateSlug } from "../utils/slug";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { Blog } from "../types/blog";

interface FormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  isFeatured: boolean;
  readingMinutes: string;
  author: string;
}

const categories = ["Destinations", "Tips", "Client Education"];

export default function EditBlog(): React.ReactElement {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const {
    user,
    loading: authLoading,
    isGoogleAuth,
    isConfigured,
    signInWithGoogle,
  } = useAuth();

  // Use TanStack Query for fetching blog data
  const { data: blog, isLoading: loading, isError } = useBlogDetail(slug);

  // Use TanStack Query mutations
  const updateBlogMutation = useUpdateBlog();
  const deleteBlogMutation = useDeleteBlog();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    category: "",
    isFeatured: false,
    readingMinutes: "",
    author: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  // Populate form data when blog is loaded
  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImageUrl: blog.coverImageUrl,
        category: blog.category,
        isFeatured: blog.isFeatured,
        readingMinutes: blog.readingMinutes.toString(),
        author: blog.author,
      });
    }
  }, [blog]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const target = e.target;
    const name = target.name;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const handleImageUpload = async (files: FileList): Promise<void> => {
    if (!files.length) return;

    setUploading(true);
    setSubmitError("");
    
    const formDataUpload = new FormData();
    formDataUpload.append("files", files[0]);
    formDataUpload.append("names[]", `blog_${Date.now()}`);
    formDataUpload.append("folders[]", "blog_images");

    try {
      const response = await api.post("/utils/upload_images", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = response.data;

      if (data.secure_url?.[0]) {
        setFormData((prev) => ({ ...prev, coverImageUrl: data.secure_url[0] }));
        if (errors.coverImageUrl) {
          setErrors((prev) => ({ ...prev, coverImageUrl: "" }));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setSubmitError("Failed to upload image. Please try again or enter a URL manually.");
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.excerpt.trim()) newErrors.excerpt = "Excerpt is required";
    if (!formData.content.trim()) newErrors.content = "Content is required";
    if (!formData.coverImageUrl.trim())
      newErrors.coverImageUrl = "Cover image URL is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.readingMinutes)
      newErrors.readingMinutes = "Reading minutes is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError("");

    if (!validate() || !blog) return;

    const payload: Partial<Blog> = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      excerpt: formData.excerpt.trim(),
      content: formData.content.trim(),
      coverImageUrl: formData.coverImageUrl.trim(),
      category: formData.category,
      isFeatured: formData.isFeatured,
      readingMinutes: parseInt(formData.readingMinutes, 10),
      author: formData.author.trim(),
    };

    updateBlogMutation.mutate(
      { id: blog.id, data: payload },
      {
        onSuccess: () => {
          navigate(`/blogs/${formData.slug}`);
        },
        onError: () => {
          setSubmitError("Failed to update blog post. Please try again.");
        },
      }
    );
  };

  const handleDelete = (): void => {
    if (!blog || !confirm("Are you sure you want to delete this blog post?"))
      return;

    deleteBlogMutation.mutate(blog.id, {
      onSuccess: () => {
        navigate("/blogs");
      },
      onError: () => {
        setSubmitError("Failed to delete blog post");
      },
    });
  };

  // Show loading state for auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not Google-authenticated
  if (!isGoogleAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Google Authentication Required
            </h1>
            <p className="text-gray-600 mb-6">
              To edit blog posts on TravelEase, you need to sign in with your
              Google account.
            </p>
            {user ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  You're currently signed in with email/password. Please link
                  your Google account to edit blogs.
                </p>
                {isConfigured && (
                  <button
                    onClick={() => signInWithGoogle()}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Link to="/login" className="btn-primary inline-block">
                  Sign In to Edit
                </Link>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                to="/blogs"
                className="text-primary-red hover:text-primary-red-dark transition-colors"
              >
                ← Back to Blogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Blog post not found</p>
          <Link to="/blogs" className="btn-primary">
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to={`/blogs/${blog.slug}`}
            className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors duration-200 mb-4"
          >
            ← Back to Blog
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Edit Blog Post
          </h1>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              URL Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red font-mono text-sm"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="excerpt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Excerpt *
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red resize-none"
            />
            {errors.excerpt && (
              <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content * (HTML supported)
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={10}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red font-mono text-sm resize-none"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image *
            </label>
            
            {/* Image Preview */}
            {formData.coverImageUrl && (
              <div className="mb-4 relative">
                <img
                  src={formData.coverImageUrl}
                  alt="Cover preview"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop&auto=format";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, coverImageUrl: "" }))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Upload Options */}
            {!formData.coverImageUrl && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-red transition-colors">
                <input
                  type="file"
                  id="coverImageFile"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="coverImageFile"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 animate-spin rounded-full border-b-2 border-primary-red" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Click to upload image</span>
                      <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 6MB</span>
                    </>
                  )}
                </label>
              </div>
            )}
            
            {/* URL Input as Alternative */}
            <div className="mt-3">
              <label htmlFor="coverImageUrl" className="block text-xs text-gray-500 mb-1">
                Or enter image URL directly:
              </label>
              <input
                type="url"
                id="coverImageUrl"
                name="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {errors.coverImageUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.coverImageUrl}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="readingMinutes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Reading Minutes *
              </label>
              <input
                type="number"
                id="readingMinutes"
                name="readingMinutes"
                value={formData.readingMinutes}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
              />
              {errors.readingMinutes && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.readingMinutes}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Author *
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
            />
            {errors.author && (
              <p className="mt-1 text-sm text-red-600">{errors.author}</p>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 text-primary-red border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Featured Post</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={
                updateBlogMutation.isPending || deleteBlogMutation.isPending
              }
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {updateBlogMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={
                updateBlogMutation.isPending || deleteBlogMutation.isPending
              }
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteBlogMutation.isPending ? "Deleting..." : "Delete"}
            </button>
            <Link to={`/blogs/${blog.slug}`} className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
