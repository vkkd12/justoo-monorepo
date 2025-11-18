import { db } from '../db/index.js';
import { inventoryUsers as usersTable } from '@justoo/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const createTestUsers = async () => {
    try {
        console.log('🚀 Creating test users...');
        console.log('📡 Connecting to database...');

        // Test database connection first
        const testConnection = await db.select().from(usersTable).limit(1);
        console.log('✅ Database connection successful');

        // Define the two test users
        const users = [
            {
                username: 'admin',
                email: 'admin@inventory.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                username: 'viewer',
                email: 'viewer@inventory.com',
                password: 'viewer123',
                role: 'viewer'
            }
        ];

        for (const userData of users) {
            try {
                // Check if user already exists
                const existingUser = await db.select().from(usersTable)
                    .where(eq(usersTable.username, userData.username));

                if (existingUser.length > 0) {
                    console.log(`⚠️  User '${userData.username}' already exists, skipping...`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 12);

                // Create user
                const newUser = await db.insert(usersTable).values({
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role,
                    isActive: 1
                }).returning();

                console.log(`✅ Created ${userData.role}: ${userData.username} (${userData.email})`);

            } catch (error) {
                console.error(`❌ Failed to create ${userData.username}: ${error.message}`);
            }
        }

        console.log('');
        console.log('🔐 Test User Credentials:');
        console.log('Admin  - username: admin,  password: admin123');
        console.log('Viewer - username: viewer, password: viewer123');
        console.log('');
        console.log('🔧 Usage:');
        console.log('1. Login at: POST http://localhost:3001/api/auth/login');
        console.log('2. Use credentials above to get JWT token');
        console.log('3. Include token in Authorization header: Bearer <token>');

    } catch (error) {
        console.error('❌ Database connection or creation error:', error.message);
        console.error('💡 Make sure your database is running and .env file is configured');
    } finally {
        process.exit(0);
    }
};

// Run the script
createTestUsers();
