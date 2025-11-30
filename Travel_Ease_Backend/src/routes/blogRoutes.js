import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import { createBlogSchema, updateBlogSchema, blogQuerySchema } from "../schemas/blogSchemas.js";

export const blogRoutes = Router();

// GET /api/blogs - List blogs with pagination, filtering, and search (public)
blogRoutes.get("/", async (req, res, next) => {
  try {
    const query = blogQuerySchema.parse(req.query);
    const { category, page, pageSize, q } = query;
    const where = {};
    if (category) {
      where.category = category;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } }
      ];
    }
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.blog.count({ where })
    ]);
    res.json({
      items: blogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    // Handle connection errors explicitly (including PrismaClientInitializationError with undefined code)
    if (
      error.constructor?.name === 'PrismaClientInitializationError' ||
      error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017'
    ) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database connection failed. Please try again later.',
        code: error.code || 'CONNECTION_ERROR'
      });
    }
    // Handle missing table error
    if (error.code === 'P2021') {
      return res.status(500).json({
        error: 'Database schema error',
        message: 'Blog table not found. Please run migrations.',
        code: error.code
      });
    }
    next(error);
  }
});

// GET /api/blogs/featured - Get featured blogs (public)
blogRoutes.get("/featured", async (req, res, next) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isFeatured: true },
      orderBy: { publishedAt: "desc" },
      take: 5
    });
    res.json(blogs);
  } catch (error) {
    // Handle connection errors explicitly (including PrismaClientInitializationError with undefined code)
    if (
      error.constructor?.name === 'PrismaClientInitializationError' ||
      error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017'
    ) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database connection failed. Please try again later.',
        code: error.code || 'CONNECTION_ERROR'
      });
    }
    // Handle missing table error
    if (error.code === 'P2021') {
      return res.status(500).json({
        error: 'Database schema error',
        message: 'Blog table not found. Please run migrations.',
        code: error.code
      });
    }
    next(error);
  }
});

// GET /api/blogs/:slug - Get single blog by slug (public)
blogRoutes.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { slug }
    });
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    next(error);
  }
});

// POST /api/blogs - Create new blog (auth required)
blogRoutes.post("/", authenticateToken, async (req, res, next) => {
  try {
    const data = createBlogSchema.parse(req.body);
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
    
    // Create blog with authenticated user as author
    const blog = await prisma.blog.create({
      data: {
        ...data,
        user_id: req.user.id,
        publishedAt
      }
    });
    res.status(201).json(blog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors
      });
    }
    next(error);
  }
});

// PUT /api/blogs/:id - Update blog (auth + ownership required)
blogRoutes.put("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existingBlog = await prisma.blog.findUnique({
      where: { id }
    });
    
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
    
    const blog = await prisma.blog.update({
      where: { id },
      data: updateData
    });
    res.json(blog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors
      });
    }
    next(error);
  }
});

// DELETE /api/blogs/:id - Delete blog (auth + ownership required)
blogRoutes.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existingBlog = await prisma.blog.findUnique({
      where: { id }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    if (existingBlog.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: "Not authorized to delete this blog",
        details: "Only the author can delete this blog"
      });
    }
    
    await prisma.blog.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
