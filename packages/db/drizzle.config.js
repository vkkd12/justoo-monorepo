import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const conf = {
    dbUrl: process.env.DATABASE_SQL_URL,
};

export default defineConfig({
    out: './drizzle',
    schema: './schema.js',
    dialect: 'postgresql',
    dbCredentials: {
        url: conf.dbUrl,
    },
});
