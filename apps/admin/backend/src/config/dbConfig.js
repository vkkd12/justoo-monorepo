import './env.js'; // Load environment variables first
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_SQL_URL) {
  throw new Error('DATABASE_SQL_URL is not defined');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_SQL_URL,
});

const db = drizzle(pool);

console.log('✅ Database connected');

export default db;