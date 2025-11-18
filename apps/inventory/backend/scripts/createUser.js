import { db } from '../db/index.js';
import { inventoryUsers as usersTable } from '@justoo/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// User creation function
const createUser = async (userData) => {
    try {
        const { username, email, password, role = 'viewer' } = userData;

        // Validation
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        if (!['admin', 'viewer'].includes(role)) {
            throw new Error('Role must be admin or viewer');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Check if user already exists
        const existingUser = await db.select().from(usersTable)
            .where(eq(usersTable.username, username.toLowerCase()));

        if (existingUser.length > 0) {
            throw new Error(`User with username '${username}' already exists`);
        }

        // Check if email already exists
        const existingEmail = await db.select().from(usersTable)
            .where(eq(usersTable.email, email.toLowerCase()));

        if (existingEmail.length > 0) {
            throw new Error(`User with email '${email}' already exists`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = await db.insert(usersTable).values({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role,
            isActive: 1
        }).returning();

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser[0];
        return userWithoutPassword;

    } catch (error) {
        throw error;
    }
};

// Script execution
const main = async () => {
    try {
        console.log('🚀 User Creation Script');
        console.log('========================');

        // Get command line arguments
        const args = process.argv.slice(2);

        if (args.length === 0) {
            console.log('📖 Usage Examples:');
            console.log('');
            console.log('Create specific user:');
            console.log('node createUser.js --username john --email john@test.com --password john123 --role manager');
            console.log('');
            console.log('Create test users (predefined):');
            console.log('node createUser.js --create-test-users');
            console.log('');
            console.log('Available roles: admin, viewer');
            process.exit(0);
        }

        // Parse arguments
        const parseArgs = (args) => {
            const parsed = {};
            for (let i = 0; i < args.length; i += 2) {
                const key = args[i].replace('--', '');
                const value = args[i + 1];
                parsed[key] = value;
            }
            return parsed;
        };

        // Check if creating test users
        if (args.includes('--create-test-users')) {
            console.log('🧪 Creating test users...');

            const testUsers = [
                {
                    username: 'admin',
                    email: 'admin@inventory.com',
                    password: 'admin123',
                    role: 'admin'
                },
                {
                    username: 'viewer1',
                    email: 'viewer1@inventory.com',
                    password: 'viewer123',
                    role: 'viewer'
                },
                {
                    username: 'john',
                    email: 'john@test.com',
                    password: 'john123',
                    role: 'viewer'
                },
                {
                    username: 'sarah',
                    email: 'sarah@test.com',
                    password: 'sarah123',
                    role: 'viewer'
                },
                {
                    username: 'testadmin',
                    email: 'testadmin@test.com',
                    password: 'test123',
                    role: 'admin'
                }
            ];

            for (const userData of testUsers) {
                try {
                    const user = await createUser(userData);
                    console.log(`✅ Created ${userData.role}: ${userData.username} (${userData.email})`);
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️  Skipped ${userData.username}: ${error.message}`);
                    } else {
                        console.error(`❌ Failed to create ${userData.username}: ${error.message}`);
                    }
                }
            }

            console.log('');
            console.log('🔐 Test User Credentials:');
            console.log('Admin   - username: admin,     password: admin123');
            console.log('Viewer  - username: viewer1,   password: viewer123');
            console.log('Viewer  - username: john,      password: john123');
            console.log('Viewer  - username: sarah,     password: sarah123');
            console.log('Admin   - username: testadmin, password: test123');

        } else {
            // Create single user from arguments
            const userData = parseArgs(args);

            if (!userData.username || !userData.email || !userData.password) {
                console.error('❌ Missing required parameters: username, email, password');
                console.log('💡 Example: node createUser.js --username john --email john@test.com --password john123 --role viewer');
                process.exit(1);
            }

            console.log(`👤 Creating user: ${userData.username}`);

            const user = await createUser(userData);

            console.log('✅ User created successfully!');
            console.log('📋 User Details:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Created: ${user.createdAt}`);
        }

        console.log('');
        console.log('🔧 Next Steps:');
        console.log('1. Start your server: npm run dev');
        console.log('2. Test login: POST /api/auth/login');
        console.log('3. Use the returned token in Authorization header');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { createUser };
