// Seed script to create a Superadmin in justoo_admins
// Usage examples:
//   pnpm run seed:superadmin
//   pnpm run seed:superadmin --username=myadmin --email=me@example.com --password=Secret123!

import bcrypt from 'bcrypt';
import { eq, or } from 'drizzle-orm';
import db from '../src/config/dbConfig.js';
import { justoo_admins as admins } from '@justoo/db';

function getArg(name, fallback) {
    const idx = process.argv.findIndex(a => a === `--${name}`);
    if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
        return process.argv[idx + 1];
    }
    return process.env[`SUPERADMIN_${name.toUpperCase()}`] || fallback;
}

async function main() {
    const username = getArg('username', 'superadmin');
    const email = getArg('email', 'superadmin@justoo.local');
    const password = getArg('password', 'ChangeMe123!');

    if (!username || !email || !password) {
        console.error('Missing required values for username/email/password');
        process.exit(1);
    }

    // Check if an admin already exists with same username or email
    const existing = await db
        .select({ id: admins.id, username: admins.username, email: admins.email })
        .from(admins)
        .where(or(eq(admins.username, username), eq(admins.email, email)));

    if (existing.length > 0) {
        const found = existing[0];
        console.log(`Superadmin already exists (id=${found.id}, username=${found.username}, email=${found.email}). Skipping insert.`);
        process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);

    const inserted = await db
        .insert(admins)
        .values({
            username,
            email,
            password: hash,
            role: 'superadmin',
            isActive: 1,
        })
        .returning({ id: admins.id, username: admins.username, email: admins.email, role: admins.role });

    const created = inserted?.[0];
    if (created) {
        console.log('✅ Superadmin created:', created);
    } else {
        console.error('Insert did not return a row. Check DB and schema.');
        process.exit(2);
    }

    // Force exit to close any open DB handles (pool)
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Failed to seed superadmin:', err);
    process.exit(1);
});
