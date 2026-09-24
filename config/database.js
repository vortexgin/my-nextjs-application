'use strict';

try {
  require('dotenv/config');
} catch {}

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/vortexgin';
const isProduction = process.env.NODE_ENV === 'production';

const base = {
  url: databaseUrl,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: isProduction ? { require: true, rejectUnauthorized: false } : false,
  },
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
