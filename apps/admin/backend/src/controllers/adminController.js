// Admin Controller
import db from '../config/dbConfig.js';
import { justoo_admins as admins } from '@justoo/db';
import { eq, and, ne, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { errorResponse, successResponse } from '../utils/response.js';
import {
    getOrderAnalytics,
    getInventoryAnalytics,
    getUserAnalytics,
    getPaymentAnalytics
} from '../utils/analytics.js';

const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;

export const addAdmin = async (req, res) => {
    const { username, email, password, role = 'admin' } = req.body;

    // Validation
    if (!username || !email || !password) {
        return errorResponse(res, 'Username, email and password are required', 400);
    }

    // Username validation
    if (username.length < 3) {
        return errorResponse(res, 'Username must be at least 3 characters long', 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return errorResponse(res, 'Please provide a valid email address', 400);
    }

    // Password validation
    if (password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    // Role validation
    const validRoles = ['superadmin', 'admin', 'inventory_admin'];
    if (!validRoles.includes(role)) {
        return errorResponse(res, 'Invalid role. Must be one of: superadmin, admin, inventory_admin', 400);
    }

    try {
        // Check if username or email already exists
        const existingUser = await db
            .select()
            .from(admins)
            .where(eq(admins.username, username))
            .limit(1);

        if (existingUser.length > 0) {
            return errorResponse(res, 'Username already exists', 409);
        }

        const existingEmail = await db
            .select()
            .from(admins)
            .where(eq(admins.email, email))
            .limit(1);

        if (existingEmail.length > 0) {
            return errorResponse(res, 'Email already exists', 409);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create admin user
        const newAdmin = await db
            .insert(admins)
            .values({
                username,
                email,
                password: hashedPassword,
                role
            })
            .returning();

        const { password: _, ...adminWithoutPassword } = newAdmin[0];

        return successResponse(res, 'Admin added successfully', adminWithoutPassword, 201);
    } catch (error) {
        console.error('Error adding admin:', error);
        return errorResponse(res, 'Failed to add admin', 500);
    }
};

export const removeAdmin = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return errorResponse(res, 'Admin ID is required', 400);
    }

    try {
        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return errorResponse(res, 'Cannot delete your own admin account', 403);
        }

        // Find the admin to delete - check for admin roles only
        const adminToDelete = await db
            .select()
            .from(admins)
            .where(and(
                eq(admins.id, parseInt(id)),
                sql`${admins.role} IN ('superadmin', 'admin', 'inventory_admin')`
            ))
            .limit(1);

        if (adminToDelete.length === 0) {
            return errorResponse(res, 'Admin not found', 404);
        }

        // Delete the admin
        const deletedAdmin = await db
            .delete(admins)
            .where(eq(admins.id, parseInt(id)))
            .returning();

        const { password: _, ...adminWithoutPassword } = deletedAdmin[0];

        return successResponse(res, 'Admin removed successfully', adminWithoutPassword);
    } catch (error) {
        console.error('Error removing admin:', error);
        return errorResponse(res, 'Failed to remove admin', 500);
    }
};

export const getAllAdmins = async (req, res) => {
    try {
        const adminsList = await db
            .select({
                id: admins.id,
                username: admins.username,
                email: admins.email,
                role: admins.role,
                isActive: admins.isActive,
                createdAt: admins.createdAt,
                updatedAt: admins.updatedAt
            })
            .from(admins)
            .where(sql`${admins.role} IN ('superadmin', 'admin', 'inventory_admin')`);

        return successResponse(res, adminsList, 'Admins retrieved successfully');
    } catch (error) {
        console.error('Error getting all admins:', error);
        return errorResponse(res, 'Failed to retrieve admins', 500);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = db
            .select({
                id: admins.id,
                username: admins.username,
                email: admins.email,
                role: admins.role,
                isActive: admins.isActive,
                createdAt: admins.createdAt,
                updatedAt: admins.updatedAt
            })
            .from(admins);

        if (role) {
            query = query.where(eq(admins.role, role));
        }

        const allUsers = await query
            .limit(parseInt(limit))
            .offset(offset);

        return successResponse(res, 'All users retrieved successfully', allUsers);
    } catch (error) {
        console.error('Error getting all users:', error);
        return errorResponse(res, 'Failed to retrieve users', 500);
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return errorResponse(res, 'User ID is required', 400);
    }

    try {
        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return errorResponse(res, 'Cannot delete your own account', 403);
        }

        // Find the user to delete
        const userToDelete = await db
            .select()
            .from(admins)
            .where(eq(admins.id, parseInt(id)))
            .limit(1);

        if (userToDelete.length === 0) {
            return errorResponse(res, 'User not found', 404);
        }

        // Delete the user
        const deletedUser = await db
            .delete(admins)
            .where(eq(admins.id, parseInt(id)))
            .returning();

        const { password: _, ...userWithoutPassword } = deletedUser[0];

        return successResponse(res, 'User deleted successfully', userWithoutPassword);
    } catch (error) {
        console.error('Error deleting user:', error);
        return errorResponse(res, 'Failed to delete user', 500);
    }
};

export const orderAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;

        const analytics = await getOrderAnalytics(period, startDate, endDate);

        return successResponse(res, analytics, 'Order analytics retrieved successfully');
    } catch (error) {
        console.error('Error getting order analytics:', error);
        return errorResponse(res, 'Failed to retrieve order analytics', 500);
    }
};

export const inventoryAnalytics = async (req, res) => {
    try {
        const analytics = await getInventoryAnalytics();

        return successResponse(res, 'Inventory analytics retrieved successfully', analytics);
    } catch (error) {
        console.error('Error getting inventory analytics:', error);
        return errorResponse(res, 'Failed to retrieve inventory analytics', 500);
    }
};

export const userAnalytics = async (req, res) => {
    try {
        const analytics = await getUserAnalytics();

        return successResponse(res, 'User analytics retrieved successfully', analytics);
    } catch (error) {
        console.error('Error getting user analytics:', error);
        return errorResponse(res, 'Failed to retrieve user analytics', 500);
    }
};

export const paymentAnalytics = async (req, res) => {
    try {
        const analytics = await getPaymentAnalytics();

        return successResponse(res, 'Payment analytics retrieved successfully', analytics);
    } catch (error) {
        console.error('Error getting payment analytics:', error);
        return errorResponse(res, 'Failed to retrieve payment analytics', 500);
    }
};

export const getDashboard = async (req, res) => {
    try {
        const { days, startDate, endDate } = req.query;

        // Calculate date range if days is provided
        let dateRange = {};
        if (days) {
            const daysNum = parseInt(days);
            const endDateObj = new Date();
            const startDateObj = new Date();
            startDateObj.setDate(endDateObj.getDate() - daysNum);

            // Pass Date objects instead of strings for Drizzle compatibility
            dateRange.startDate = startDateObj;
            dateRange.endDate = endDateObj;
        } else if (startDate && endDate) {
            // Parse string dates to Date objects
            dateRange.startDate = new Date(startDate);
            dateRange.endDate = new Date(endDate);
        }

        const [orderStats, inventoryStats, userStats, paymentStats] = await Promise.all([
            getOrderAnalytics('daily', dateRange.startDate, dateRange.endDate),
            getInventoryAnalytics(),
            getUserAnalytics(),
            getPaymentAnalytics()
        ]);

        const dashboard = {
            orders: orderStats,
            inventory: inventoryStats,
            users: userStats,
            payments: paymentStats,
            timestamp: new Date().toISOString(),
            dateRange: {
                startDate: dateRange.startDate?.toISOString().split('T')[0],
                endDate: dateRange.endDate?.toISOString().split('T')[0]
            }
        };

        return successResponse(res, dashboard, 'Dashboard data retrieved successfully');
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        return errorResponse(res, 'Failed to retrieve dashboard data', 500);
    }
};
