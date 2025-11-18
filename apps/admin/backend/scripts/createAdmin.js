import '../src/config/env.js'; // Load environment variables first
import db from '../src/config/dbConfig.js';
import { admins } from './src/models/admin.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Admin creation function
const createAdmin = async (adminData) => {
    try {
        const { username, email, password, role = 'admin' } = adminData;

        // Validation
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        if (!['superadmin', 'admin', 'inventory_admin'].includes(role)) {
            throw new Error('Role must be superadmin, admin, or inventory_admin');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Check if admin already exists
        const existingAdmin = await db.select().from(admins)
            .where(eq(admins.username, username.toLowerCase()));

        if (existingAdmin.length > 0) {
            throw new Error(`Admin with username '${username}' already exists`);
        }

        // Check if email already exists
        const existingEmail = await db.select().from(admins)
            .where(eq(admins.email, email.toLowerCase()));

        if (existingEmail.length > 0) {
            throw new Error(`Admin with email '${email}' already exists`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const newAdmin = await db.insert(admins).values({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role,
            isActive: 1
        }).returning();

        // Return admin without password
        const { password: _, ...adminWithoutPassword } = newAdmin[0];
        return adminWithoutPassword;

    } catch (error) {
        throw error;
    }
};

// Script execution
const main = async () => {
    try {
        console.log('🚀 Admin Creation Script for Justoo Admin Backend');
        console.log('=================================================');

        // Get command line arguments
        const args = process.argv.slice(2);

        if (args.length === 0) {
            console.log('📖 Usage Examples:');
            console.log('');
            console.log('Create specific admin:');
            console.log('node createAdmin.js --username superadmin --email super@admin.com --password super123 --role superadmin');
            console.log('');
            console.log('Create default admins (predefined):');
            console.log('node createAdmin.js --create-default-admins');
            console.log('');
            console.log('Available roles: superadmin, admin, inventory_admin');
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

        // Check if creating default admins
        if (args.includes('--create-default-admins')) {
            console.log('🧪 Creating default admin users...');

            const defaultAdmins = [
                {
                    username: 'superadmin',
                    email: 'superadmin@justoo.com',
                    password: 'super123',
                    role: 'superadmin'
                },
                {
                    username: 'admin',
                    email: 'admin@justoo.com',
                    password: 'admin123',
                    role: 'admin'
                },
                {
                    username: 'inventory_admin',
                    email: 'inventory@justoo.com',
                    password: 'inventory123',
                    role: 'inventory_admin'
                },
                {
                    username: 'testadmin',
                    email: 'test@justoo.com',
                    password: 'test123',
                    role: 'admin'
                }
            ];

            for (const adminData of defaultAdmins) {
                try {
                    const newAdmin = await createAdmin(adminData);
                    console.log(`✅ Created ${adminData.role}: ${adminData.username} (${adminData.email})`);
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️  Skipped ${adminData.username}: ${error.message}`);
                    } else {
                        console.error(`❌ Failed to create ${adminData.username}: ${error.message}`);
                    }
                }
            }

            console.log('');
            console.log('🔐 Default Admin Credentials:');
            console.log('SuperAdmin  - username: superadmin,     password: super123');
            console.log('Admin       - username: admin,          password: admin123');
            console.log('Inventory   - username: inventory_admin, password: inventory123');
            console.log('Test Admin  - username: testadmin,      password: test123');

        } else {
            // Create single admin from arguments
            const adminData = parseArgs(args);

            if (!adminData.username || !adminData.email || !adminData.password) {
                console.error('❌ Missing required parameters: username, email, password');
                console.log('💡 Example: node createAdmin.js --username admin --email admin@justoo.com --password admin123 --role admin');
                process.exit(1);
            }

            console.log(`👤 Creating admin: ${adminData.username}`);

            const newAdmin = await createAdmin(adminData);

            console.log('✅ Admin created successfully!');
            console.log('📋 Admin Details:');
            console.log(`   ID: ${newAdmin.id}`);
            console.log(`   Username: ${newAdmin.username}`);
            console.log(`   Email: ${newAdmin.email}`);
            console.log(`   Role: ${newAdmin.role}`);
            console.log(`   Created: ${newAdmin.createdAt}`);
        }

        console.log('');
        console.log('🔧 Next Steps:');
        console.log('1. Start your server: npm run dev');
        console.log('2. Test login: POST /api/auth/login');
        console.log('3. Use the admin frontend at http://localhost:3000');
        console.log('');
        console.log('⚠️  IMPORTANT: Change default passwords in production!');

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

export { createAdmin };
