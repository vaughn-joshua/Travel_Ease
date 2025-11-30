/**
 * Sequelize singleton instance
 * Optimized for Supabase PostgreSQL with connection pooling and retry logic
 */

import { Sequelize } from 'sequelize';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse SSL settings from environment or default to requiring SSL
const sslEnabled = process.env.DB_SSL !== 'false';

// Connection retry settings
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// For Supabase, we need to handle SSL properly
const dialectOptions = sslEnabled ? {
  ssl: {
    require: true,
    rejectUnauthorized: false,
    // This is needed for some Node.js versions
    checkServerIdentity: () => undefined
  },
  // Connection timeout for Supabase
  connectTimeout: 30000,
  // Statement timeout (30 seconds)
  statement_timeout: 30000
} : {};

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' 
    ? (msg) => console.log(`[Sequelize] ${msg}`) 
    : false,
  dialectOptions,
  define: {
    // Use snake_case for auto-generated fields
    underscored: true,
    // Don't add timestamps by default (we'll add them explicitly where needed)
    timestamps: false,
    // Don't pluralize table names
    freezeTableName: true
  },
  pool: {
    max: 10,           // Increased for better concurrency
    min: 0,
    acquire: 60000,    // Increased timeout for Supabase cold starts
    idle: 10000,
    evict: 30000       // Check for stale connections every 30s
  },
  retry: {
    max: MAX_RETRIES,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/,
      /ECONNRESET/,
      /ECONNREFUSED/
    ]
  }
});

// Test connection with retry logic
export async function testConnection(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  console.error('Unable to connect to the database after all retries.');
  return false;
}

// Execute query with automatic retry for transient failures
export async function executeWithRetry(queryFn, retries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      const isTransient = 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'SequelizeConnectionRefusedError' ||
        error.name === 'SequelizeConnectionTimedOutError' ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ECONNREFUSED');
      
      if (!isTransient || attempt >= retries) {
        throw error;
      }
      
      console.warn(`Transient DB error (attempt ${attempt}/${retries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
  throw lastError;
}

// Graceful shutdown
const shutdown = async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

process.on('beforeExit', shutdown);
process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

export default sequelize;

