import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { blogApi } from "../services/api";
import { generateSlug } from "../utils/slug";
import { sanitizeHtml } from "../utils/sanitize";
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
  publishedAt: string;
}

const categories = ["Destinations", "Tips", "Client Education"];

export default function NewBlog(): React.ReactElement {
  const navigate = useNavigate();
  
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
    publishedAt: "",
  });
  
  const [slugAuto, setSlugAuto] = useState<boolean>(true);
  const [saveDraft, setSaveDraft] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (slugAuto && formData.title) {
      const generated = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: generated }));
    }
  }, [formData.title, slugAuto]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" 
      ? (target as HTMLInputElement).checked 
      : target.value;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
    setSuccessMessage("");
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = generateSlug(e.target.value);
    setFormData((prev) => ({ ...prev, slug: value }));
    setSlugAuto(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = "Excerpt is required";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    if (!formData.coverImageUrl.trim()) {
      newErrors.coverImageUrl = "Cover image URL is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.readingMinutes) {
      newErrors.readingMinutes = "Reading minutes is required";
    }
    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validate()) return;

    setSubmitting(true);

    try {
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

      if (!saveDraft) {
        payload.publishedAt = formData.publishedAt
          ? new Date(formData.publishedAt).toISOString()
          : new Date().toISOString();
      }

      const created = await blogApi.createBlog(payload);
      setSuccessMessage("Blog post created successfully! Redirecting...");

      setTimeout(() => {
        navigate(`/blogs/${created.slug}`);
      }, 1500);
    } catch (err: unknown) {
      setSubmitError("Failed to create blog post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sanitizedContent = sanitizeHtml(formData.content);
  const wordCount = formData.content ? formData.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadingTime = wordCount > 0 ? Math.ceil(wordCount / 200) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/blogs"
            className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors duration-200 mb-4"
          >
            ← Back to Blogs
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Blog Post</h1>
          <p className="text-gray-600">Share your travel story with the world</p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-medium">{submitError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red font-mono text-sm"
            />
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
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
            {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
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
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {wordCount} words • ~{estimatedReadingTime} min read
            </p>
          </div>

          <div>
            <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL *
            </label>
            <input
              type="url"
              id="coverImageUrl"
              name="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red"
              placeholder="https://example.com/image.jpg"
            />
            {errors.coverImageUrl && <p className="mt-1 text-sm text-red-600">{errors.coverImageUrl}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="readingMinutes" className="block text-sm font-medium text-gray-700 mb-2">
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
              {errors.readingMinutes && <p className="mt-1 text-sm text-red-600">{errors.readingMinutes}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
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
            {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author}</p>}
          </div>

          <div className="flex items-center gap-6">
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

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={saveDraft}
                onChange={(e) => setSaveDraft(e.target.checked)}
                className="w-4 h-4 text-primary-red border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Save as draft</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Blog Post"}
            </button>
            <Link to="/blogs" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

