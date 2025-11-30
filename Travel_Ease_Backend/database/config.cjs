/**
 * Sequelize CLI configuration
 * Uses CommonJS format for CLI compatibility
 */

require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

// Parse DATABASE_URL if available
let config = {
  url: databaseUrl,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
};

// Override SSL for local development if DB_SSL=false
if (process.env.DB_SSL === 'false') {
  config.dialectOptions = {};
}

module.exports = {
  development: config,
  test: {
    ...config,
    logging: false
  },
  production: config
};

