import 'dotenv/config';
import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    DATABASE_SQL_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    BCRYPT_ROUNDS: z.string().default('12'),
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),
});

// Parse and validate environment variables with friendly errors
let env;
try {
    env = envSchema.parse(process.env);
} catch (err) {
    // ZodError prints a helpful message, but show a concise summary here
    console.error('\nEnvironment validation error:');
    if (err && err.errors) {
        err.errors.forEach(e => {
            console.error(` - ${e.path.join('.')} : ${e.message}`);
        });
    } else {
        console.error(err);
    }
    console.error('\nPlease set the required environment variables (e.g. in your .env file).');
    process.exit(1);
}

export default env;