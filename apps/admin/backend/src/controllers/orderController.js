// Order Controller - Read Only for Admin Dashboard
import db from '../config/dbConfig.js';
import { orders, orderItems, justoo_admins as admins, items } from '@justoo/db';
import { eq, and, desc, asc, count, sum, sql, between } from 'drizzle-orm';
import { errorResponse, successResponse } from '../utils/response.js';

// Get all orders with pagination and filtering
export const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            userId,
            customerId,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = Number.parseInt(page) || 1;
        const limitNum = Number.parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        // Build query conditions
        const conditions = [];

        if (status) {
            conditions.push(eq(orders.status, status));
        }

        const customerFilter = userId || customerId; // accept either param name
        if (customerFilter) {
            conditions.push(eq(orders.customerId, Number.parseInt(customerFilter)));
        }

        if (startDate && endDate) {
            conditions.push(between(orders.createdAt, startDate, endDate));
        }

        // Build base query
        let query = db
            .select({
                id: orders.id,
                customerId: orders.customerId,
                status: orders.status,
                totalAmount: orders.totalAmount,
                itemCount: orders.itemCount,
                notes: orders.notes,
                createdAt: orders.createdAt,
                updatedAt: orders.updatedAt
            })
            .from(orders);

        // Apply conditions
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Apply sorting
        const sortColumn = orders[sortBy] || orders.createdAt;
        query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

        // Get orders with pagination
        const ordersList = await query.limit(limitNum).offset(offset);

        // Get total count
        let countQuery = db.select({ count: count() }).from(orders);
        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }
        const totalOrders = await countQuery;

        return successResponse(res, 'Orders retrieved successfully', {
            orders: ordersList,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalOrders[0].count / limitNum),
                totalItems: totalOrders[0].count,
                hasNext: pageNum * limitNum < totalOrders[0].count,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Error getting orders:', error);
        return errorResponse(res, 'Failed to retrieve orders', 500);
    }
};

// Get order by ID with details
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 'Order ID is required', 400);
        }

        // Get order details
        const order = await db
            .select()
            .from(orders)
            .where(eq(orders.id, parseInt(id)))
            .limit(1);

        if (order.length === 0) {
            return errorResponse(res, 'Order not found', 404);
        }

        // Get order items
        const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, parseInt(id)));

        return successResponse(res, 'Order retrieved successfully', {
            order: order[0],
            items: items
        });
    } catch (error) {
        console.error('Error getting order:', error);
        return errorResponse(res, 'Failed to retrieve order', 500);
    }
};

// Get order analytics
export const getOrderAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        // Build conditions
        const conditions = [];
        if (startDate && endDate) {
            conditions.push(between(orders.createdAt, startDate, endDate));
        }
        if (status) {
            conditions.push(eq(orders.status, status));
        }

        // Total orders
        let totalQuery = db.select({ count: count() }).from(orders);
        if (conditions.length > 0) {
            totalQuery = totalQuery.where(and(...conditions));
        }
        const totalOrders = await totalQuery;

        // Orders by status
        let statusQuery = db
            .select({
                status: orders.status,
                count: count(),
                totalRevenue: sum(orders.totalAmount)
            })
            .from(orders)
            .groupBy(orders.status);

        if (conditions.length > 0) {
            statusQuery = statusQuery.where(and(...conditions));
        }
        const ordersByStatus = await statusQuery;

        // Revenue analytics
        let revenueQuery = db
            .select({
                totalRevenue: sum(orders.totalAmount),
                avgOrderValue: sql`AVG(${orders.totalAmount})`,
                maxOrderValue: sql`MAX(${orders.totalAmount})`,
                minOrderValue: sql`MIN(${orders.totalAmount})`
            })
            .from(orders);

        if (conditions.length > 0) {
            revenueQuery = revenueQuery.where(and(...conditions));
        }
        const revenueStats = await revenueQuery;

        // Recent orders (last 10)
        let recentQuery = db
            .select()
            .from(orders)
            .orderBy(desc(orders.createdAt))
            .limit(10);

        if (conditions.length > 0) {
            recentQuery = recentQuery.where(and(...conditions));
        }
        const recentOrders = await recentQuery;

        const analytics = {
            overview: {
                totalOrders: totalOrders[0].count,
                ordersByStatus: ordersByStatus,
                revenue: revenueStats[0]
            },
            recentOrders: recentOrders,
            timestamp: new Date().toISOString()
        };

        return successResponse(res, 'Order analytics retrieved successfully', analytics);
    } catch (error) {
        console.error('Error getting order analytics:', error);
        return errorResponse(res, 'Failed to retrieve order analytics', 500);
    }
};