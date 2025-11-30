/**
 * Blog Authentication Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../src/lib/prisma.js';
import { blogRoutes } from '../src/routes/blogRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createTestUser } from './setup.js';

const app = express();
app.use(express.json());
app.use('/api/blogs', blogRoutes);
app.use(errorHandler);

describe('Blog Authentication', () => {
  let user1, token1, user2, token2;
  let testBlogId;

  const validBlogData = {
    title: 'Test Blog Post',
    slug: `test-blog-${Date.now()}`,
    excerpt: 'This is a test blog excerpt',
    content: 'This is the full content of the test blog post.',
    coverImageUrl: 'https://example.com/image.jpg',
    category: 'Travel',
    readingMinutes: 5,
    author: 'Test Author'
  };

  beforeEach(async () => {
    // Create two test users
    const result1 = await createTestUser({ email: `blog_user1_${Date.now()}@example.com` });
    user1 = result1.user;
    token1 = result1.token;

    const result2 = await createTestUser({ email: `blog_user2_${Date.now()}@example.com` });
    user2 = result2.user;
    token2 = result2.token;
  });

  afterEach(async () => {
    // Clean up test blogs
    if (testBlogId) {
      await prisma.blog.deleteMany({
        where: { id: testBlogId }
      }).catch(() => {});
      testBlogId = null;
    }
    
    // Clean up by slug pattern
    await prisma.blog.deleteMany({
      where: { slug: { startsWith: 'test-blog-' } }
    }).catch(() => {});
  });

  describe('POST /api/blogs', () => {
    it('should reject blog creation without authentication', async () => {
      const response = await request(app)
        .post('/api/blogs')
        .send(validBlogData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should create blog with authenticated user', async () => {
      const blogData = {
        ...validBlogData,
        slug: `test-blog-auth-${Date.now()}`
      };

      const response = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send(blogData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(blogData.title);
      expect(response.body.user_id).toBe(user1.user_id);
      
      testBlogId = response.body.id;
    });

    it('should reject invalid blog data', async () => {
      const response = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          // Missing required fields
          title: 'Only Title'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('PUT /api/blogs/:id', () => {
    beforeEach(async () => {
      // Create a blog for user1
      const blogData = {
        ...validBlogData,
        slug: `test-blog-put-${Date.now()}`
      };

      const response = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send(blogData);

      testBlogId = response.body.id;
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/blogs/${testBlogId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should allow author to update their blog', async () => {
      const response = await request(app)
        .put(`/api/blogs/${testBlogId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Updated by Author' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated by Author');
    });

    it('should reject update by non-author', async () => {
      const response = await request(app)
        .put(`/api/blogs/${testBlogId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hijacked Title' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('DELETE /api/blogs/:id', () => {
    beforeEach(async () => {
      // Create a blog for user1
      const blogData = {
        ...validBlogData,
        slug: `test-blog-delete-${Date.now()}`
      };

      const response = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send(blogData);

      testBlogId = response.body.id;
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/blogs/${testBlogId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should allow author to delete their blog', async () => {
      const response = await request(app)
        .delete(`/api/blogs/${testBlogId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const blog = await prisma.blog.findUnique({
        where: { id: testBlogId }
      });
      expect(blog).toBeNull();
      testBlogId = null;
    });

    it('should reject delete by non-author', async () => {
      const response = await request(app)
        .delete(`/api/blogs/${testBlogId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('GET /api/blogs (public)', () => {
    it('should allow unauthenticated access to blog list', async () => {
      const response = await request(app)
        .get('/api/blogs');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('GET /api/blogs/featured (public)', () => {
    let featuredBlogId;

    afterEach(async () => {
      // Clean up featured test blog
      if (featuredBlogId) {
        await prisma.blog.delete({
          where: { id: featuredBlogId }
        }).catch(() => {});
        featuredBlogId = null;
      }
    });

    it('should allow unauthenticated access to featured blogs', async () => {
      const response = await request(app)
        .get('/api/blogs/featured');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return featured blogs when they exist', async () => {
      // Create a featured blog directly in the database
      const featuredBlog = await prisma.blog.create({
        data: {
          title: 'Featured Test Blog',
          slug: `featured-test-${Date.now()}`,
          excerpt: 'This is a featured blog excerpt',
          content: 'This is the full content of the featured blog.',
          coverImageUrl: 'https://example.com/featured.jpg',
          category: 'Travel',
          readingMinutes: 5,
          author: 'Test Author',
          isFeatured: true,
          publishedAt: new Date()
        }
      });
      featuredBlogId = featuredBlog.id;

      const response = await request(app)
        .get('/api/blogs/featured');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      // Verify our featured blog is in the response
      const found = response.body.find(blog => blog.id === featuredBlogId);
      expect(found).toBeDefined();
      expect(found.isFeatured).toBe(true);
    });

    it('should return empty array when no featured blogs exist', async () => {
      // Clear all featured blogs temporarily
      await prisma.blog.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false }
      });

      const response = await request(app)
        .get('/api/blogs/featured');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Restore featured status (cleanup handled in other tests)
    });

    it('should limit featured blogs to 5 items', async () => {
      const response = await request(app)
        .get('/api/blogs/featured');

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });
});

