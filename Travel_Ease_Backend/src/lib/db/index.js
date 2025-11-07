/**
 * PostgreSQL database client replacing Prisma.
 * Uses pg library for direct database access.
 */

import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database schema
async function initializeSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Blog" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        excerpt VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        "coverImageUrl" TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        "isFeatured" BOOLEAN DEFAULT false,
        "readingMinutes" INTEGER NOT NULL,
        "publishedAt" TIMESTAMP DEFAULT NOW(),
        author VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_blog_slug ON "Blog"(slug);
      CREATE INDEX IF NOT EXISTS idx_blog_category ON "Blog"(category);
      CREATE INDEX IF NOT EXISTS idx_blog_is_featured ON "Blog"("isFeatured");
      CREATE INDEX IF NOT EXISTS idx_blog_published_at ON "Blog"("publishedAt");
    `);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Error initializing schema:', error);
    // Don't throw - allow app to continue if table already exists
  }
}

// Initialize on module load
initializeSchema();

// Helper function to build WHERE clause from Prisma-style where object
function buildWhereClause(where, params = []) {
  if (!where || Object.keys(where).length === 0) {
    return { clause: '', params };
  }

  const conditions = [];
  let paramIndex = params.length + 1;

  // Handle simple equality
  if (where.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(where.category);
    paramIndex++;
  }

  if (where.isFeatured !== undefined) {
    conditions.push(`"isFeatured" = $${paramIndex}`);
    params.push(where.isFeatured);
    paramIndex++;
  }

  // Handle OR conditions (for search)
  if (where.OR && Array.isArray(where.OR)) {
    const orConditions = [];
    where.OR.forEach((orCondition) => {
      if (orCondition.title?.contains) {
        orConditions.push(`title ILIKE $${paramIndex}`);
        params.push(`%${orCondition.title.contains}%`);
        paramIndex++;
      }
      if (orCondition.excerpt?.contains) {
        orConditions.push(`excerpt ILIKE $${paramIndex}`);
        params.push(`%${orCondition.excerpt.contains}%`);
        paramIndex++;
      }
    });
    if (orConditions.length > 0) {
      conditions.push(`(${orConditions.join(' OR ')})`);
    }
  }

  // Handle slug or id for findUnique
  if (where.slug) {
    conditions.push(`slug = $${paramIndex}`);
    params.push(where.slug);
    paramIndex++;
  }

  if (where.id) {
    conditions.push(`id = $${paramIndex}`);
    params.push(where.id);
    paramIndex++;
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

// Helper to build ORDER BY clause
function buildOrderByClause(orderBy) {
  if (!orderBy) {
    return 'ORDER BY "publishedAt" DESC';
  }

  const orderByEntries = Object.entries(orderBy);
  if (orderByEntries.length === 0) {
    return 'ORDER BY "publishedAt" DESC';
  }

  const [field, direction] = orderByEntries[0];
  const directionStr = direction === 'asc' ? 'ASC' : 'DESC';
  const fieldStr = field === 'publishedAt' ? '"publishedAt"' : `"${field}"`;
  return `ORDER BY ${fieldStr} ${directionStr}`;
}

// Convert database row to Blog object
function rowToBlog(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.coverImageUrl,
    category: row.category,
    isFeatured: row.isFeatured,
    readingMinutes: row.readingMinutes,
    publishedAt: row.publishedAt,
    author: row.author,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

class DatabaseClient {
  blog = {
    findMany: async (options = {}) => {
      const { where = {}, orderBy, skip = 0, take = 10 } = options;
      const params = [];
      const { clause: whereClause, params: whereParams } = buildWhereClause(where, params);
      const orderByClause = buildOrderByClause(orderBy);

      const limitIndex = whereParams.length + 1;
      const offsetIndex = whereParams.length + 2;

      const query = `
        SELECT * FROM "Blog"
        ${whereClause}
        ${orderByClause}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;
      whereParams.push(take, skip);

      const result = await pool.query(query, whereParams);
      return result.rows.map(rowToBlog);
    },

    findUnique: async (options) => {
      const { where } = options;
      const params = [];
      const { clause: whereClause, params: whereParams } = buildWhereClause(where, params);

      if (!whereClause) {
        return null;
      }

      const query = `SELECT * FROM "Blog" ${whereClause} LIMIT 1`;
      const result = await pool.query(query, whereParams);

      if (result.rows.length === 0) {
        return null;
      }

      return rowToBlog(result.rows[0]);
    },

    count: async (options = {}) => {
      const { where = {} } = options;
      const params = [];
      const { clause: whereClause, params: whereParams } = buildWhereClause(where, params);

      const query = `SELECT COUNT(*) as count FROM "Blog" ${whereClause}`;
      const result = await pool.query(query, whereParams);

      return parseInt(result.rows[0].count, 10);
    },

    create: async (options) => {
      const { data } = options;
      const params = [
        data.title,
        data.slug,
        data.excerpt,
        data.content,
        data.coverImageUrl,
        data.category,
        data.isFeatured ?? false,
        data.readingMinutes,
        data.publishedAt || new Date(),
        data.author,
      ];

      const query = `
        INSERT INTO "Blog" (
          title, slug, excerpt, content, "coverImageUrl", category,
          "isFeatured", "readingMinutes", "publishedAt", author
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, params);
      return rowToBlog(result.rows[0]);
    },

    update: async (options) => {
      const { where, data } = options;
      const setParams = [];
      const updates = [];
      let paramIndex = 1;

      // Build SET clause
      Object.keys(data).forEach((key) => {
        if (key !== 'id') {
          const dbKey = key === 'publishedAt' ? '"publishedAt"' : 
                       key === 'coverImageUrl' ? '"coverImageUrl"' :
                       key === 'isFeatured' ? '"isFeatured"' :
                       key === 'readingMinutes' ? '"readingMinutes"' :
                       key === 'createdAt' ? '"createdAt"' :
                       key === 'updatedAt' ? '"updatedAt"' :
                       key;
          updates.push(`"${dbKey}" = $${paramIndex}`);
          setParams.push(data[key]);
          paramIndex++;
        }
      });

      // Always update updatedAt
      updates.push(`"updatedAt" = $${paramIndex}`);
      setParams.push(new Date());
      paramIndex++;

      // Build WHERE clause separately
      const { clause: whereClause, params: whereParams } = buildWhereClause(where, []);

      if (!whereClause) {
        throw new Error('Update requires a where clause');
      }

      // Rebuild where clause with correct param indices (after SET params)
      let finalWhereClause = whereClause;
      whereParams.forEach((param, idx) => {
        const oldIndex = idx + 1;
        const newIndex = paramIndex + idx;
        finalWhereClause = finalWhereClause.replace(
          new RegExp(`\\$${oldIndex}\\b`, 'g'),
          `$${newIndex}`
        );
      });

      const query = `
        UPDATE "Blog"
        SET ${updates.join(', ')}
        ${finalWhereClause}
        RETURNING *
      `;

      const allParams = [...setParams, ...whereParams];
      const result = await pool.query(query, allParams);

      if (result.rows.length === 0) {
        throw new Error('Blog not found');
      }

      return rowToBlog(result.rows[0]);
    },

    delete: async (options) => {
      const { where } = options;
      const params = [];
      const { clause: whereClause, params: whereParams } = buildWhereClause(where, params);

      if (!whereClause) {
        throw new Error('Delete requires a where clause');
      }

      const query = `DELETE FROM "Blog" ${whereClause} RETURNING *`;
      const result = await pool.query(query, whereParams);

      if (result.rows.length === 0) {
        throw new Error('Blog not found');
      }
    },

    deleteMany: async () => {
      const query = 'DELETE FROM "Blog"';
      await pool.query(query);
    },
  };

  $disconnect = async () => {
    await pool.end();
  };
}

// Singleton instance (matching Prisma pattern)
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new DatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
