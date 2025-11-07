import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticateApiKey } from "../middleware/auth.js";
import { createBlogSchema, updateBlogSchema, blogQuerySchema } from "../schemas/blogSchemas.js";
export const blogRoutes = Router();

// GET /api/blogs - List blogs with pagination, filtering, and search
blogRoutes.get("/", async (req, res, next) => {
  try {
    const query = blogQuerySchema.parse(req.query);
    const {
      category,
      page,
      pageSize,
      q
    } = query;
    const where = {};
    if (category) {
      where.category = category;
    }
    if (q) {
      where.OR = [{
        title: {
          contains: q,
          mode: "insensitive"
        }
      }, {
        excerpt: {
          contains: q,
          mode: "insensitive"
        }
      }];
    }
    const [blogs, total] = await Promise.all([prisma.blog.findMany({
      where,
      orderBy: {
        publishedAt: "desc"
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    }), prisma.blog.count({
      where
    })]);
    res.json({
      items: blogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/blogs/featured - Get featured blogs
blogRoutes.get("/featured", async (req, res, next) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: {
        isFeatured: true
      },
      orderBy: {
        publishedAt: "desc"
      },
      take: 5
    });
    res.json(blogs);
  } catch (error) {
    next(error);
  }
});

// GET /api/blogs/:slug - Get single blog by slug
blogRoutes.get("/:slug", async (req, res, next) => {
  try {
    const {
      slug
    } = req.params;
    const blog = await prisma.blog.findUnique({
      where: {
        slug
      }
    });
    if (!blog) {
      return res.status(404).json({
        error: "Blog not found"
      });
    }
    res.json(blog);
  } catch (error) {
    next(error);
  }
});

// POST /api/blogs - Create new blog (protected)
blogRoutes.post("/", authenticateApiKey, async (req, res, next) => {
  try {
    const data = createBlogSchema.parse(req.body);
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
    const blog = await prisma.blog.create({
      data: {
        ...data,
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

// PUT /api/blogs/:id - Update blog (protected)
blogRoutes.put("/:id", authenticateApiKey, async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const data = updateBlogSchema.parse(req.body);
    const updateData = {
      ...data
    };
    if (data.publishedAt) {
      updateData.publishedAt = new Date(data.publishedAt);
    }
    const blog = await prisma.blog.update({
      where: {
        id
      },
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

// DELETE /api/blogs/:id - Delete blog (protected)
blogRoutes.delete("/:id", authenticateApiKey, async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    await prisma.blog.delete({
      where: {
        id
      }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});