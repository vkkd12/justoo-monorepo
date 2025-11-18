import { db } from '../db/index.js';
import { inventoryUsers as usersTable } from '@justoo/db';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
    try {
        console.log('🌱 Seeding admin user...');

        // Check if admin already exists
        const existingAdmin = await db.select().from(usersTable)
            .where(eq(usersTable.username, 'admin'));

        if (existingAdmin.length > 0) {
            console.log('✅ Admin user already exists');
            return;
        }

        // Create admin user
        const adminPassword = 'admin123'; // Change this to a secure password
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        const newAdmin = await db.insert(usersTable).values({
            username: 'admin',
            email: 'admin@inventory.com',
            password: hashedPassword,
            role: 'admin',
            isActive: 1
        }).returning();

        console.log('✅ Admin user created successfully!');
        console.log('👤 Username: admin');
        console.log('🔐 Password: admin123');
        console.log('📧 Email: admin@inventory.com');
        console.log('⚠️  Please change the password after first login!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin user:', error);
        process.exit(1);
    }
};

// Import eq function
import { eq } from 'drizzle-orm';

seedAdmin();
