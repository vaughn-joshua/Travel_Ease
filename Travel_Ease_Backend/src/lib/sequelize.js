/**
 * Sequelize singleton instance
 * Replaces Prisma with Sequelize ORM
 */

import { Sequelize } from 'sequelize';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse SSL settings from environment or default to requiring SSL
const sslEnabled = process.env.DB_SSL !== 'false';

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: sslEnabled ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  define: {
    // Use snake_case for auto-generated fields
    underscored: true,
    // Don't add timestamps by default (we'll add them explicitly where needed)
    timestamps: false,
    // Don't pluralize table names
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await sequelize.close();
});

export default sequelize;

