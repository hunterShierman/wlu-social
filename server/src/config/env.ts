import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 8000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || '',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || ''
};