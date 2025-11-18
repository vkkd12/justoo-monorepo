import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from '@justoo/db';

// Load environment variables from .env file
dotenv.config();

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create the database instance
const db = drizzle(pool, { schema });

export default db;