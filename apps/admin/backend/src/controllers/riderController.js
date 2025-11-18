// Rider Controller
import db from '../config/dbConfig.js';
import { justoo_riders as riders, orders, orderItems } from '@justoo/db';
import { eq, and, count, sum, avg, desc, asc, sql, between, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { errorResponse, successResponse } from '../utils/response.js';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;
// Add new rider
export const addRider = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            vehicle_type,
            vehicle_number,
            license_number,
            password,
            status = 'active'
        } = req.body;

        // Validation
        if (!name || !phone || !vehicle_type || !vehicle_number || !password) {
            return errorResponse(res, 'Name, phone, vehicle type, vehicle number, and password are required', 400);
        }

        // Password validation
        if (password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        // Phone validation
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone)) {
            return errorResponse(res, 'Please provide a valid phone number', 400);
        }

        // Email validation (if provided)
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return errorResponse(res, 'Please provide a valid email address', 400);
            }
        }

        // Vehicle type validation
        const validVehicleTypes = ['bike', 'scooter', 'car', 'van'];
        if (!validVehicleTypes.includes(vehicle_type)) {
            return errorResponse(res, 'Invalid vehicle type. Must be one of: bike, scooter, car, van', 400);
        }

        // Status validation
        const validStatuses = ['active', 'inactive', 'busy'];
        if (!validStatuses.includes(status)) {
            return errorResponse(res, 'Invalid status. Must be one of: active, inactive, busy', 400);
        }

        // Check if phone number already exists
        const existingPhone = await db
            .select()
            .from(riders)
            .where(eq(riders.phone, phone))
            .limit(1);

        if (existingPhone.length > 0) {
            return errorResponse(res, 'Phone number already exists', 409);
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await db
                .select()
                .from(riders)
                .where(eq(riders.email, email))
                .limit(1);

            if (existingEmail.length > 0) {
                return errorResponse(res, 'Email already exists', 409);
            }
        }

        // Generate username from name (lowercase, replace spaces with underscores)
        const username = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now().toString().slice(-4);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create rider
        const newRider = await db
            .insert(riders)
            .values({
                username,
                name,
                phone,
                email: email || null,
                password: hashedPassword,
                vehicleType: vehicle_type,
                vehicleNumber: vehicle_number,
                licenseNumber: license_number || null,
                status,
                isActive: 1
            })
            .returning();

        const { password: _, ...riderWithoutPassword } = newRider[0];

        return successResponse(res, 'Rider added successfully', riderWithoutPassword, 201);
    } catch (error) {
        console.error('Error adding rider:', error);
        return errorResponse(res, 'Failed to add rider', 500);
    }
};

export const removeRider = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 'Rider ID is required', 400);
        }

        // Check if rider exists
        const rider = await db
            .select()
            .from(riders)
            .where(eq(riders.id, parseInt(id)))
            .limit(1);

        if (rider.length === 0) {
            return errorResponse(res, 'Rider not found', 404);
        }

        // Soft delete by setting isActive to 0
        const removedRider = await db
            .update(riders)
            .set({
                isActive: 0,
                updatedAt: new Date().toISOString()
            })
            .where(eq(riders.id, parseInt(id)))
            .returning();

        const { password: _, ...riderWithoutPassword } = removedRider[0];

        return successResponse(res, 'Rider removed successfully', riderWithoutPassword);
    } catch (error) {
        console.error('Error removing rider:', error);
        return errorResponse(res, 'Failed to remove rider', 500);
    }
};

// Get all riders with pagination and filtering
export const getAllRiders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            isActive,
            sortBy = 'username',
            sortOrder = 'asc',
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let query = db
            .select({
                id: riders.id,
                username: riders.username,
                name: riders.name,
                phone: riders.phone,
                email: riders.email,
                vehicle_type: riders.vehicleType,
                vehicle_number: riders.vehicleNumber,
                license_number: riders.licenseNumber,
                status: riders.status,
                total_deliveries: riders.totalDeliveries,
                rating: riders.rating,
                isActive: riders.isActive,
                lastLogin: riders.lastLogin,
                created_at: riders.createdAt,
                updated_at: riders.updatedAt
            })
            .from(riders);

        // Apply filters
        const conditions = [];

        if (isActive !== undefined) {
            conditions.push(eq(riders.isActive, parseInt(isActive)));
        }

        if (search) {
            conditions.push(sql`${riders.username} ILIKE ${'%' + search + '%'} OR ${riders.email} ILIKE ${'%' + search + '%'} OR ${riders.name} ILIKE ${'%' + search + '%'} OR ${riders.phone} ILIKE ${'%' + search + '%'}`);
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Apply sorting
        const sortColumn = riders[sortBy] || riders.username;
        query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

        // Apply pagination
        const ridersList = await query.limit(parseInt(limit)).offset(offset);

        // Get total count for pagination
        let countQuery = db.select({ count: count() }).from(riders);
        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }
        const totalRiders = await countQuery;

        return successResponse(res, {
            riders: ridersList,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRiders[0].count / limit),
                totalItems: totalRiders[0].count,
                hasNext: page * limit < totalRiders[0].count,
                hasPrev: page > 1
            }
        }, 'Riders retrieved successfully');
    } catch (error) {
        console.error('Error getting riders:', error);
        return errorResponse(res, 'Failed to retrieve riders', 500);
    }
};

// Get rider by ID
export const getRiderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 'Rider ID is required', 400);
        }

        const rider = await db
            .select({
                id: riders.id,
                username: riders.username,
                name: riders.name,
                phone: riders.phone,
                email: riders.email,
                vehicle_type: riders.vehicleType,
                vehicle_number: riders.vehicleNumber,
                license_number: riders.licenseNumber,
                status: riders.status,
                total_deliveries: riders.totalDeliveries,
                rating: riders.rating,
                isActive: riders.isActive,
                lastLogin: riders.lastLogin,
                created_at: riders.createdAt,
                updated_at: riders.updatedAt
            })
            .from(riders)
            .where(eq(riders.id, parseInt(id)))
            .limit(1);

        if (rider.length === 0) {
            return errorResponse(res, 'Rider not found', 404);
        }

        return successResponse(res, 'Rider retrieved successfully', rider[0]);
    } catch (error) {
        console.error('Error getting rider:', error);
        return errorResponse(res, 'Failed to retrieve rider', 500);
    }
};

// Update rider information
export const updateRider = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            phone,
            email,
            vehicle_type,
            vehicle_number,
            license_number,
            password,
            status,
            isActive
        } = req.body;

        if (!id) {
            return errorResponse(res, 'Rider ID is required', 400);
        }

        // Check if rider exists
        const existingRider = await db
            .select()
            .from(riders)
            .where(eq(riders.id, parseInt(id)))
            .limit(1);

        if (existingRider.length === 0) {
            return errorResponse(res, 'Rider not found', 404);
        }

        // Validation
        if (phone) {
            const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(phone)) {
                return errorResponse(res, 'Please provide a valid phone number', 400);
            }
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return errorResponse(res, 'Please provide a valid email address', 400);
            }
        }

        if (vehicle_type) {
            const validVehicleTypes = ['bike', 'scooter', 'car', 'van'];
            if (!validVehicleTypes.includes(vehicle_type)) {
                return errorResponse(res, 'Invalid vehicle type. Must be one of: bike, scooter, car, van', 400);
            }
        }

        if (status) {
            const validStatuses = ['active', 'inactive', 'busy'];
            if (!validStatuses.includes(status)) {
                return errorResponse(res, 'Invalid status. Must be one of: active, inactive, busy', 400);
            }
        }

        if (password && password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        // Check for duplicate phone/email if being updated
        if (phone || email) {
            const conditions = [sql`${riders.id} != ${parseInt(id)}`];
            const orConditions = [];

            if (phone) orConditions.push(eq(riders.phone, phone));
            if (email) orConditions.push(eq(riders.email, email));

            if (orConditions.length > 0) {
                conditions.push(or(...orConditions));
            }

            const duplicateCheck = await db
                .select()
                .from(riders)
                .where(and(...conditions))
                .limit(1);

            if (duplicateCheck.length > 0) {
                const field = (phone && duplicateCheck[0].phone === phone) ? 'Phone' : 'Email';
                return errorResponse(res, `${field} already exists`, 409);
            }
        }

        // Update rider
        const updateData = {
            updatedAt: new Date()
        };

        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (vehicle_type !== undefined) updateData.vehicleType = vehicle_type;
        if (vehicle_number !== undefined) updateData.vehicleNumber = vehicle_number;
        if (license_number !== undefined) updateData.licenseNumber = license_number;
        if (status !== undefined) updateData.status = status;
        if (isActive !== undefined) updateData.isActive = parseInt(isActive);

        // Hash password if provided
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 12);
        }

        const updatedRider = await db
            .update(riders)
            .set(updateData)
            .where(eq(riders.id, parseInt(id)))
            .returning();

        const { password: _, ...riderWithoutPassword } = updatedRider[0];

        return successResponse(res, 'Rider updated successfully', riderWithoutPassword);
    } catch (error) {
        console.error('Error updating rider:', error);
        return errorResponse(res, 'Failed to update rider', 500);
    }
};

// Get rider analytics and performance
export const getRiderAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, riderId } = req.query;

        // Overall rider statistics
        const riderStats = await getRiderStatistics();

        // Performance analytics
        const performanceData = await getRiderPerformance(startDate, endDate, riderId);

        // Activity analytics
        const activityData = await getRiderActivity(startDate, endDate);

        const analytics = {
            overview: riderStats,
            performance: performanceData,
            activity: activityData,
            timestamp: new Date().toISOString()
        };

        return successResponse(res, 'Rider analytics retrieved successfully', analytics);
    } catch (error) {
        console.error('Error getting rider analytics:', error);
        return errorResponse(res, 'Failed to retrieve rider analytics', 500);
    }
};

// Helper function: Get rider statistics
const getRiderStatistics = async () => {
    // Total riders
    const totalRiders = await db
        .select({ count: count() })
        .from(riders);

    // Active riders
    const activeRiders = await db
        .select({ count: count() })
        .from(riders)
        .where(eq(riders.isActive, 1));

    // Inactive riders
    const inactiveRiders = await db
        .select({ count: count() })
        .from(riders)
        .where(eq(riders.isActive, 0));

    // Recent registrations (last 30 days)
    const recentRegistrations = await db
        .select({ count: count() })
        .from(riders)
        .where(sql`${riders.createdAt} >= NOW() - INTERVAL '30 days'`);

    const total = totalRiders[0].count;

    return {
        totalRiders: total,
        activeRiders: {
            count: activeRiders[0].count,
            percentage: total > 0 ? ((activeRiders[0].count / total) * 100).toFixed(2) : 0
        },
        inactiveRiders: {
            count: inactiveRiders[0].count,
            percentage: total > 0 ? ((inactiveRiders[0].count / total) * 100).toFixed(2) : 0
        },
        recentRegistrations: recentRegistrations[0].count
    };
};

// Helper function: Get rider performance (orders assigned/delivered)
const getRiderPerformance = async (startDate, endDate, riderId) => {
    // Note: This assumes orders table has a riderId field for assignment
    // If you don't have this field, you'll need to modify based on your order assignment logic

    let conditions = [];

    if (startDate && endDate) {
        conditions.push(between(orders.createdAt, startDate, endDate));
    }

    if (riderId) {
        // Assuming you have a riderId field in orders table
        // conditions.push(eq(orders.riderId, parseInt(riderId)));
    }

    // For now, returning placeholder data since order-rider assignment structure isn't clear
    return {
        note: "Order-rider assignment tracking requires additional database fields",
        placeholder: {
            totalAssignedOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            cancelledOrders: 0,
            averageDeliveryTime: 0,
            topPerformers: []
        }
    };
};

// Helper function: Get rider activity
const getRiderActivity = async (startDate, endDate) => {
    let query = db
        .select({
            riderId: riders.id,
            username: riders.username,
            email: riders.email,
            lastLogin: riders.lastLogin,
            isActive: riders.isActive,
            registrationDate: riders.createdAt
        })
        .from(riders)
        .orderBy(desc(riders.lastLogin));

    const riderActivity = await query.limit(20);

    // Calculate activity metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const activeToday = riderActivity.filter(rider => {
        if (!rider.lastLogin) return false;
        const lastLogin = new Date(rider.lastLogin);
        const today = new Date();
        return lastLogin.toDateString() === today.toDateString();
    }).length;

    const activeThisWeek = riderActivity.filter(rider => {
        if (!rider.lastLogin) return false;
        const lastLogin = new Date(rider.lastLogin);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastLogin >= weekAgo;
    }).length;

    const activeThisMonth = riderActivity.filter(rider => {
        if (!rider.lastLogin) return false;
        const lastLogin = new Date(rider.lastLogin);
        return lastLogin >= thirtyDaysAgo;
    }).length;

    return {
        recentActivity: riderActivity,
        activitySummary: {
            activeToday,
            activeThisWeek,
            activeThisMonth,
            totalRiders: riderActivity.length
        }
    };
};

// Change rider password
export const changeRiderPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!id || !newPassword) {
            return errorResponse(res, 'Rider ID and new password are required', 400);
        }

        if (newPassword.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        // Check if rider exists
        const rider = await db
            .select()
            .from(riders)
            .where(eq(riders.id, parseInt(id)))
            .limit(1);

        if (rider.length === 0) {
            return errorResponse(res, 'Rider not found', 404);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        await db
            .update(riders)
            .set({
                password: hashedPassword,
                updatedAt: new Date().toISOString()
            })
            .where(eq(riders.id, parseInt(id)));

        return successResponse(res, 'Rider password updated successfully');
    } catch (error) {
        console.error('Error changing rider password:', error);
        return errorResponse(res, 'Failed to change rider password', 500);
    }
};