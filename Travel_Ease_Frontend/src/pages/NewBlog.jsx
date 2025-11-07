import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { blogApi } from "../services/api";
import { generateSlug } from "../utils/slug";
import { sanitizeHtml } from "../utils/sanitize";

/**
 * Blog Authoring Page
 * 
 * Usage:
 * 1. Navigate to /blogs/new
 * 2. Fill in blog fields
 * 3. Slug auto-generates from title (can be manually edited)
 * 4. Preview updates live
 * 5. Submit to create blog post
 */
export default function NewBlog() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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
  
  const [slugAuto, setSlugAuto] = useState(true);
  const [saveDraft, setSaveDraft] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const categories = ["Destinations", "Tips", "Client Education"];
  
  useEffect(() => {
    if (slugAuto && formData.title) {
      const generated = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: generated }));
    }
  }, [formData.title, slugAuto]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
    setSuccessMessage("");
  };
  
  const handleSlugChange = (e) => {
    const value = generateSlug(e.target.value);
    setFormData((prev) => ({ ...prev, slug: value }));
    setSlugAuto(false);
  };
  
  const resetSlug = () => {
    const generated = generateSlug(formData.title);
    setFormData((prev) => ({ ...prev, slug: generated }));
    setSlugAuto(true);
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }
    
    if (!formData.slug || formData.slug.trim().length === 0) {
      newErrors.slug = "Slug is required";
    } else if (formData.slug.length > 200) {
      newErrors.slug = "Slug must be 200 characters or less";
    }
    
    if (!formData.excerpt || formData.excerpt.trim().length === 0) {
      newErrors.excerpt = "Excerpt is required";
    } else if (formData.excerpt.length > 500) {
      newErrors.excerpt = "Excerpt must be 500 characters or less";
    }
    
    if (!formData.content || formData.content.trim().length === 0) {
      newErrors.content = "Content is required";
    }
    
    if (!formData.coverImageUrl || formData.coverImageUrl.trim().length === 0) {
      newErrors.coverImageUrl = "Cover image URL is required";
    } else {
      try {
        new URL(formData.coverImageUrl);
      } catch {
        newErrors.coverImageUrl = "Invalid URL format";
      }
    }
    
    if (!formData.category || formData.category.trim().length === 0) {
      newErrors.category = "Category is required";
    }
    
    if (!formData.readingMinutes || formData.readingMinutes.trim().length === 0) {
      newErrors.readingMinutes = "Reading minutes is required";
    } else {
      const minutes = parseInt(formData.readingMinutes, 10);
      if (isNaN(minutes) || minutes < 1) {
        newErrors.readingMinutes = "Reading minutes must be at least 1";
      }
    }
    
    if (!formData.author || formData.author.trim().length === 0) {
      newErrors.author = "Author is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    
    if (!validate()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
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
      
      if (!saveDraft && formData.publishedAt) {
        payload.publishedAt = new Date(formData.publishedAt).toISOString();
      } else if (!saveDraft) {
        payload.publishedAt = new Date().toISOString();
      }
      
      const created = await blogApi.createBlog(payload);
      
      setSuccessMessage("Blog post created successfully! Redirecting...");
      
      setTimeout(() => {
        navigate(`/blogs/${created.slug}`);
      }, 1500);
    } catch (err) {
      if (err.response?.status === 400) {
        const details = err.response.data?.details || [];
        const validationErrors = {};
        details.forEach((detail) => {
          validationErrors[detail.path?.[0] || "form"] = detail.message;
        });
        setErrors(validationErrors);
        setSubmitError("Validation failed. Please check the form.");
      } else if (err.response?.status === 500) {
        setSubmitError("Server error. Please try again later.");
      } else if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        setSubmitError("Cannot connect to server. Please check your connection.");
      } else {
        setSubmitError("Failed to create blog post. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReset = () => {
    setFormData({
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
    setSlugAuto(true);
    setSaveDraft(false);
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
  };
  
  const sanitizedContent = sanitizeHtml(formData.content);
  const previewDate = formData.publishedAt 
    ? new Date(formData.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
  const wordCount = formData.content ? formData.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadingTime = wordCount > 0 ? Math.ceil(wordCount / 200) : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/blogs"
            className="inline-flex items-center text-primary-red hover:text-primary-red-dark transition-colors duration-200 mb-4"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Blog Post</h1>
          <p className="text-gray-600">Share your travel story with the world</p>
        </div>
        
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{submitError}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={200}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.title ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Enter a compelling title for your blog post"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.title}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.title.length}/200 characters
                  </p>
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      maxLength={200}
                      className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors font-mono text-sm ${
                        errors.slug ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                      placeholder="url-friendly-slug"
                    />
                    {!slugAuto && (
                      <button
                        type="button"
                        onClick={resetSlug}
                        className="px-4 py-3 text-sm text-primary-red border border-primary-red rounded-lg hover:bg-primary-red hover:text-white transition-colors whitespace-nowrap"
                      >
                        Reset to Auto
                      </button>
                    )}
                  </div>
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.slug}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-generated from title. Can be manually edited.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    maxLength={500}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors resize-none ${
                      errors.excerpt ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Write a brief, engaging description of your blog post"
                  />
                  {errors.excerpt && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.excerpt}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.excerpt.length}/500 characters
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Content</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Blog Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={12}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors font-mono text-sm resize-none ${
                      errors.content ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Enter HTML content (e.g., &lt;p&gt;Your content here&lt;/p&gt;)"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.content}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>HTML content will be sanitized for security</span>
                    {wordCount > 0 && (
                      <span className="font-medium">
                        {wordCount} words • ~{estimatedReadingTime} min read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Media & Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="coverImageUrl"
                    name="coverImageUrl"
                    value={formData.coverImageUrl}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.coverImageUrl ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.coverImageUrl && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.coverImageUrl}
                    </p>
                  )}
                  {formData.coverImageUrl && (
                    <div className="mt-3 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={formData.coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/800x450?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                        errors.category ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.category}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="readingMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                      Reading Minutes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="readingMinutes"
                      name="readingMinutes"
                      value={formData.readingMinutes}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                        errors.readingMinutes ? "border-red-500 bg-red-50" : "border-gray-300"
                      }`}
                      placeholder="5"
                    />
                    {errors.readingMinutes && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.readingMinutes}
                      </p>
                    )}
                    {estimatedReadingTime > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Estimated: {estimatedReadingTime} min based on content
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors ${
                      errors.author ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Your name"
                  />
                  {errors.author && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.author}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Post</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveDraft}
                      onChange={(e) => setSaveDraft(e.target.checked)}
                      className="w-4 h-4 text-primary-red border-gray-300 rounded focus:ring-primary-red"
                    />
                    <span className="ml-2 text-sm text-gray-700">Save as draft</span>
                  </label>
                </div>
                
                {!saveDraft && (
                  <div>
                    <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-2">
                      Published Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="publishedAt"
                      name="publishedAt"
                      value={formData.publishedAt}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to publish immediately
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publish Blog Post
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
          
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
              </h2>
              
              {formData.title || formData.coverImageUrl ? (
                <div className="space-y-4">
                  {formData.coverImageUrl && (
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={formData.coverImageUrl}
                        alt={formData.title || "Preview"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/800x450?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  )}
                  
                  <div>
                    {formData.category && (
                      <span className="inline-block bg-primary-red text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                        {formData.category}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {formData.title || "Untitled"}
                    </h3>
                    {formData.excerpt && (
                      <p className="text-gray-600 mb-4 leading-relaxed">{formData.excerpt}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                      {formData.author && (
                        <span className="font-medium">By {formData.author}</span>
                      )}
                      <span>{previewDate}</span>
                      {formData.readingMinutes && (
                        <>
                          <span>•</span>
                          <span>{formData.readingMinutes} min read</span>
                        </>
                      )}
                    </div>
                    
                    {formData.content && (
                      <div
                        className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    Preview will appear here as you fill in the form
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
