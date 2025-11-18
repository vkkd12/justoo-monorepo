import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { conf } from './conf/conf';

export default defineConfig({
    out: './drizzle',
    schema: './db/schema.js',
    dialect: 'postgresql',
    dbCredentials: {
        url: conf.dbUrl,
    },
});
