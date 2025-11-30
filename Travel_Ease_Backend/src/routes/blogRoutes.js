import { Router } from "express";
import { z } from "zod";
import { Op } from "sequelize";
import { Blog } from "../models/index.js";
import { executeWithRetry } from "../lib/sequelize.js";
import { authenticateToken } from "../middleware/auth.js";
import { createBlogSchema, updateBlogSchema, blogQuerySchema } from "../schemas/blogSchemas.js";
import { 
  parsePagination, 
  buildPaginationMeta, 
  handleSequelizeError 
} from "../lib/queryHelpers.js";

export const blogRoutes = Router();

/**
 * Middleware to require Google OAuth authentication for blog operations
 * Only users who signed in with Google can create/edit/delete blogs
 */
const requireGoogleAuth = (req, res, next) => {
  if (req.user.auth_provider !== 'google') {
    return res.status(403).json({
      error: "Google authentication required",
      details: "Only users authenticated via Google can publish or edit blogs. Please sign in with Google to access this feature."
    });
  }
  next();
};

// GET /api/blogs - List blogs with pagination, filtering, and search (public)
blogRoutes.get("/", async (req, res, next) => {
  try {
    const query = blogQuerySchema.parse(req.query);
    const { category, q } = query;
    const { page, pageSize, limit, offset } = parsePagination(query);

    // Build where clause
    const where = {};
    if (category) {
      where.category = category;
    }
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { excerpt: { [Op.iLike]: `%${q}%` } }
      ];
    }

    // Execute queries with retry for transient failures
    const [blogs, total] = await executeWithRetry(() => 
      Promise.all([
        Blog.findAll({
          where,
          order: [['publishedAt', 'DESC']],
          limit,
          offset
        }),
        Blog.count({ where })
      ])
    );

    res.json({
      items: blogs,
      ...buildPaginationMeta(total, page, pageSize)
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    return handleSequelizeError(error, res, 'Fetching blogs');
  }
});

// GET /api/blogs/featured - Get featured blogs (public)
blogRoutes.get("/featured", async (req, res, next) => {
  try {
    const blogs = await executeWithRetry(() =>
      Blog.findAll({
        where: { isFeatured: true },
        order: [['publishedAt', 'DESC']],
        limit: 5
      })
    );
    res.json(blogs);
  } catch (error) {
    return handleSequelizeError(error, res, 'Fetching featured blogs');
  }
});

// GET /api/blogs/:slug - Get single blog by slug (public)
blogRoutes.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await executeWithRetry(() =>
      Blog.findOne({ where: { slug } })
    );
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    return handleSequelizeError(error, res, 'Fetching blog');
  }
});

// POST /api/blogs - Create new blog (Google auth required)
blogRoutes.post("/", authenticateToken, requireGoogleAuth, async (req, res, next) => {
  try {
    const data = createBlogSchema.parse(req.body);
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
    
    // Create blog with authenticated user as author
    const blog = await executeWithRetry(() =>
      Blog.create({
        ...data,
        user_id: req.user.id,
        publishedAt
      })
    );
    res.status(201).json(blog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors
      });
    }
    return handleSequelizeError(error, res, 'Creating blog');
  }
});

// PUT /api/blogs/:id - Update blog (Google auth + ownership required)
blogRoutes.put("/:id", authenticateToken, requireGoogleAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existingBlog = await executeWithRetry(() =>
      Blog.findByPk(id)
    );
    
    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    if (existingBlog.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: "Not authorized to edit this blog",
        details: "Only the author can edit this blog"
      });
    }
    
    const data = updateBlogSchema.parse(req.body);
    const updateData = { ...data };
    if (data.publishedAt) {
      updateData.publishedAt = new Date(data.publishedAt);
    }
    
    await existingBlog.update(updateData);
    res.json(existingBlog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors
      });
    }
    return handleSequelizeError(error, res, 'Updating blog');
  }
});

// DELETE /api/blogs/:id - Delete blog (Google auth + ownership required)
blogRoutes.delete("/:id", authenticateToken, requireGoogleAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existingBlog = await executeWithRetry(() =>
      Blog.findByPk(id)
    );
    
    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    if (existingBlog.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: "Not authorized to delete this blog",
        details: "Only the author can delete this blog"
      });
    }
    
    await existingBlog.destroy();
    res.status(204).send();
  } catch (error) {
    return handleSequelizeError(error, res, 'Deleting blog');
  }
});
