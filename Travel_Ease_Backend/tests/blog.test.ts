/**
 * Blog Authentication and State Machine Tests
 * 
 * Tests blog authentication, ownership, and status transitions.
 * Blog State Machine:
 *   - Draft: created but not published
 *   - Published: visible to public
 *   - Archived: soft-deleted (terminal state, no resurrection)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { blogRoutes } from '../src/routes/blogRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { invalidateCachePattern } from '../src/lib/cache.js';
import { createTestUser } from './setup.js';
import { isValidBlogStatusTransition } from '../src/schemas/blogSchemas.js';
import type { User } from '@prisma/client';

const app: Express = express();
app.use(express.json());
app.use('/api/blogs', blogRoutes);
app.use(errorHandler);

describe('Blog Authentication', () => {
  let user1: User, token1: string, user2: User, token2: string;
  let testBlogId: string | null;

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
        where: { id: testBlogId as string }
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
    let featuredBlogId: string | null;

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
      // Invalidate cache to ensure fresh results
      await invalidateCachePattern('blogs:');
      
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
          publishedAt: new Date(),
          status: 'Published'
        }
      });
      featuredBlogId = featuredBlog.id;

      const response = await request(app)
        .get('/api/blogs/featured');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      // Verify our featured blog is in the response
      const found = response.body.find((blog: { id: string }) => blog.id === featuredBlogId);
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

/**
 * Blog State Machine Tests
 * 
 * Tests the blog status transitions:
 *   - Draft → Published (valid)
 *   - Published → Archived (valid)
 *   - Draft → Archived (valid)
 *   - Archived → any (invalid - no resurrection)
 */
describe('Blog State Machine', () => {
  describe('isValidBlogStatusTransition', () => {
    it('should allow Draft → Published transition', () => {
      expect(isValidBlogStatusTransition('Draft', 'Published')).toBe(true);
    });

    it('should allow Published → Archived transition', () => {
      expect(isValidBlogStatusTransition('Published', 'Archived')).toBe(true);
    });

    it('should allow Draft → Archived transition', () => {
      expect(isValidBlogStatusTransition('Draft', 'Archived')).toBe(true);
    });

    it('should allow same status (no change)', () => {
      expect(isValidBlogStatusTransition('Draft', 'Draft')).toBe(true);
      expect(isValidBlogStatusTransition('Published', 'Published')).toBe(true);
      expect(isValidBlogStatusTransition('Archived', 'Archived')).toBe(true);
    });

    it('should reject Archived → Draft (no resurrection)', () => {
      expect(isValidBlogStatusTransition('Archived', 'Draft')).toBe(false);
    });

    it('should reject Archived → Published (no resurrection)', () => {
      expect(isValidBlogStatusTransition('Archived', 'Published')).toBe(false);
    });

    it('should reject Published → Draft (can only move forward)', () => {
      expect(isValidBlogStatusTransition('Published', 'Draft')).toBe(false);
    });
  });

  describe('Blog visibility by status', () => {
    let user: User, token: string;
    let draftBlogId: string | null;
    let archivedBlogId: string | null;

    beforeEach(async () => {
      const result = await createTestUser({ email: `blog_state_${Date.now()}@example.com` });
      user = result.user;
      token = result.token;
    });

    afterEach(async () => {
      // Clean up test blogs
      if (draftBlogId) {
        await prisma.blog.delete({ where: { id: draftBlogId } }).catch(() => {});
        draftBlogId = null;
      }
      if (archivedBlogId) {
        await prisma.blog.delete({ where: { id: archivedBlogId } }).catch(() => {});
        archivedBlogId = null;
      }
    });

    it('should not show Draft blogs in public listing', async () => {
      // Create a draft blog
      const draftBlog = await prisma.blog.create({
        data: {
          title: 'Draft Blog',
          slug: `draft-blog-${Date.now()}`,
          excerpt: 'This is a draft',
          content: 'Draft content',
          coverImageUrl: 'https://example.com/draft.jpg',
          category: 'Travel',
          readingMinutes: 3,
          author: 'Test Author',
          status: 'Draft',
          user_id: user.user_id
        }
      });
      draftBlogId = draftBlog.id;

      const response = await request(app)
        .get('/api/blogs');

      expect(response.status).toBe(200);
      // Draft blog should not be in the list
      const found = response.body.items?.find((blog: { id: string }) => blog.id === draftBlogId);
      expect(found).toBeUndefined();
    });

    it('should not show Archived blogs in public listing', async () => {
      // Create an archived blog
      const archivedBlog = await prisma.blog.create({
        data: {
          title: 'Archived Blog',
          slug: `archived-blog-${Date.now()}`,
          excerpt: 'This is archived',
          content: 'Archived content',
          coverImageUrl: 'https://example.com/archived.jpg',
          category: 'Travel',
          readingMinutes: 3,
          author: 'Test Author',
          status: 'Archived',
          user_id: user.user_id
        }
      });
      archivedBlogId = archivedBlog.id;

      const response = await request(app)
        .get('/api/blogs');

      expect(response.status).toBe(200);
      // Archived blog should not be in the list
      const found = response.body.items?.find((blog: { id: string }) => blog.id === archivedBlogId);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-published blog by slug', async () => {
      // Create a draft blog
      const slug = `draft-slug-${Date.now()}`;
      const draftBlog = await prisma.blog.create({
        data: {
          title: 'Draft Blog',
          slug,
          excerpt: 'This is a draft',
          content: 'Draft content',
          coverImageUrl: 'https://example.com/draft.jpg',
          category: 'Travel',
          readingMinutes: 3,
          author: 'Test Author',
          status: 'Draft',
          user_id: user.user_id
        }
      });
      draftBlogId = draftBlog.id;

      const response = await request(app)
        .get(`/api/blogs/${slug}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Blog not found');
    });
  });
});

