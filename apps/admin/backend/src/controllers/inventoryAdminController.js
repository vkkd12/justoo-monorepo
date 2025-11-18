// Inventory Admin Controller - For admin system to manage inventory users
import bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import db from '../config/dbConfig.js';
import { inventory_users as inventoryUsers } from '@justoo/db';

class InventoryAdminController {
    // Get all inventory users
    async getInventoryAdmins(req, res) {
        try {
            const users = await db.select().from(inventoryUsers);

            // Remove password from response
            const sanitizedUsers = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json({
                success: true,
                data: sanitizedUsers
            });
        } catch (error) {
            console.error('Error fetching inventory admins:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch inventory admins'
            });
        }
    }

    // Get single inventory user
    async getInventoryAdmin(req, res) {
        try {
            const { id } = req.params;

            const user = await db.select()
                .from(inventoryUsers)
                .where(eq(inventoryUsers.id, parseInt(id)))
                .limit(1);

            if (user.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory admin not found'
                });
            }

            // Remove password from response
            const { password, ...userWithoutPassword } = user[0];

            res.json({
                success: true,
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Error fetching inventory admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch inventory admin'
            });
        }
    }

    // Create new inventory user
    async createInventoryAdmin(req, res) {
        try {
            const { username, email, password, role = 'viewer' } = req.body;

            // Validate required fields
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, email, and password are required'
                });
            }

            // Check if username or email already exists
            const existingUser = await db.select()
                .from(inventoryUsers)
                .where(
                    eq(inventoryUsers.username, username)
                );

            if (existingUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            const existingEmail = await db.select()
                .from(inventoryUsers)
                .where(
                    eq(inventoryUsers.email, email)
                );

            if (existingEmail.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newUser = await db.insert(inventoryUsers)
                .values({
                    username,
                    email,
                    password: hashedPassword,
                    role,
                    createdBy: req.user.id, // Admin who created this user
                    isActive: 1
                })
                .returning();

            // Remove password from response
            const { password: _, ...userWithoutPassword } = newUser[0];

            res.status(201).json({
                success: true,
                message: 'Inventory admin created successfully',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Error creating inventory admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create inventory admin'
            });
        }
    }

    // Update inventory user
    async updateInventoryAdmin(req, res) {
        try {
            const { id } = req.params;
            const { username, email, password, role, isActive } = req.body;

            // Check if user exists
            const existingUser = await db.select()
                .from(inventoryUsers)
                .where(eq(inventoryUsers.id, parseInt(id)))
                .limit(1);

            if (existingUser.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory admin not found'
                });
            }

            // Prepare update data
            const updateData = {
                updatedAt: new Date().toISOString()
            };

            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (role) updateData.role = role;
            if (isActive !== undefined) updateData.isActive = isActive;

            // Hash password if provided
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            // Check for duplicate username/email if being updated
            if (username || email) {
                let duplicateConditions = [];

                if (username) {
                    duplicateConditions.push(eq(inventoryUsers.username, username));
                }
                if (email) {
                    duplicateConditions.push(eq(inventoryUsers.email, email));
                }

                if (duplicateConditions.length > 0) {
                    const duplicateCheck = await db.select()
                        .from(inventoryUsers)
                        .where(and(
                            ...duplicateConditions,
                            sql`${inventoryUsers.id} != ${parseInt(id)}`
                        ));

                    if (duplicateCheck.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Username or email already exists'
                        });
                    }
                }
            }

            // Update user
            const updatedUser = await db.update(inventoryUsers)
                .set(updateData)
                .where(eq(inventoryUsers.id, parseInt(id)))
                .returning();

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser[0];

            res.json({
                success: true,
                message: 'Inventory admin updated successfully',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Error updating inventory admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update inventory admin'
            });
        }
    }

    // Delete inventory user
    async deleteInventoryAdmin(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await db.select()
                .from(inventoryUsers)
                .where(eq(inventoryUsers.id, parseInt(id)))
                .limit(1);

            if (existingUser.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory admin not found'
                });
            }

            // Delete user
            await db.delete(inventoryUsers)
                .where(eq(inventoryUsers.id, parseInt(id)));

            res.json({
                success: true,
                message: 'Inventory admin deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting inventory admin:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete inventory admin'
            });
        }
    }

    // Toggle user active status
    async toggleInventoryAdminStatus(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await db.select()
                .from(inventoryUsers)
                .where(eq(inventoryUsers.id, parseInt(id)))
                .limit(1);

            if (existingUser.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Inventory admin not found'
                });
            }

            const newStatus = existingUser[0].isActive ? 0 : 1;

            // Update status
            const updatedUser = await db.update(inventoryUsers)
                .set({
                    isActive: newStatus,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(inventoryUsers.id, parseInt(id)))
                .returning();

            // Remove password from response
            const { password, ...userWithoutPassword } = updatedUser[0];

            res.json({
                success: true,
                message: `Inventory admin ${newStatus ? 'activated' : 'deactivated'} successfully`,
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Error toggling inventory admin status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle inventory admin status'
            });
        }
    }
}

export default new InventoryAdminController();
