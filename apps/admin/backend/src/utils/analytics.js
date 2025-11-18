// Analytics utility functions
import db from '../config/dbConfig.js';
import { orders, order_items, items, justoo_admins as admins, justoo_payments as payments } from '@justoo/db';
import { eq, and, between, count, sum, avg, desc, asc, sql } from 'drizzle-orm';

export const getOrderAnalytics = async (period = 'daily', startDate, endDate) => {
    try {
        // Base query conditions
        const baseConditions = [];

        if (startDate && endDate) {
            // Use SQL template literals for proper date handling
            baseConditions.push(
                sql`${orders.createdAt} >= ${startDate} AND ${orders.createdAt} <= ${endDate}`
            );
        }

        // Total orders
        const totalOrdersResult = await db
            .select({ count: count() })
            .from(orders)
            .where(and(...baseConditions));

        // Orders by status
        const ordersByStatusResult = await db
            .select({
                status: orders.status,
                count: count()
            })
            .from(orders)
            .where(and(...baseConditions))
            .groupBy(orders.status);

        // Revenue analytics
        const revenueResult = await db
            .select({
                totalRevenue: sum(orders.totalAmount),
                avgOrderValue: avg(orders.totalAmount),
                maxOrderValue: sql`MAX(${orders.totalAmount})`,
                minOrderValue: sql`MIN(${orders.totalAmount})`
            })
            .from(orders)
            .where(and(...baseConditions, eq(orders.status, 'delivered')));

        // Daily revenue trend (last 30 days or within date range)
        let dailyRevenueQuery = db
            .select({
                date: sql`DATE(${orders.createdAt})`,
                revenue: sum(orders.totalAmount),
                orderCount: count()
            })
            .from(orders)
            .where(and(
                eq(orders.status, 'delivered')
            ))
            .groupBy(sql`DATE(${orders.createdAt})`)
            .orderBy(sql`DATE(${orders.createdAt})`);

        // Apply date filter to daily trend if provided
        if (startDate && endDate) {
            dailyRevenueQuery = dailyRevenueQuery.where(
                and(
                    sql`${orders.createdAt} >= ${startDate}`,
                    sql`${orders.createdAt} <= ${endDate}`
                )
            );
        } else {
            // Default to last 30 days if no date range provided
            dailyRevenueQuery = dailyRevenueQuery.where(
                sql`${orders.createdAt} >= NOW() - INTERVAL '30 days'`
            );
        }

        const dailyRevenueResult = await dailyRevenueQuery;

        return {
            totalOrders: totalOrdersResult[0]?.count || 0,
            ordersByStatus: ordersByStatusResult.reduce((acc, curr) => {
                acc[curr.status] = curr.count;
                return acc;
            }, {}),
            revenue: {
                total: revenueResult[0]?.totalRevenue || 0,
                average: revenueResult[0]?.avgOrderValue || 0,
                highest: revenueResult[0]?.maxOrderValue || 0,
                lowest: revenueResult[0]?.minOrderValue || 0
            },
            dailyTrend: dailyRevenueResult
        };
    } catch (error) {
        console.error('Error fetching order analytics:', error);
        throw error;
    }
};

export const getInventoryAnalytics = async (startDate, endDate) => {
    try {
        // Base query conditions
        const baseConditions = [];

        if (startDate && endDate) {
            baseConditions.push(
                sql`${items.createdAt} >= ${startDate} AND ${items.createdAt} <= ${endDate}`
            );
        }

        // Low stock items
        const lowStockResult = await db
            .select()
            .from(items)
            .where(and(
                sql`${items.quantity} <= ${items.minStockLevel}`,
                ...baseConditions
            ));

        // Total items and value
        const inventoryStatsResult = await db
            .select({
                totalItems: count(),
                totalValue: sum(sql`${items.price} * ${items.quantity}`),
                avgPrice: avg(items.price)
            })
            .from(items)
            .where(and(
                eq(items.isActive, 1),
                ...baseConditions
            ));

        // Category-wise distribution
        const categoryStatsResult = await db
            .select({
                category: items.category,
                itemCount: count(),
                totalValue: sum(sql`${items.price} * ${items.quantity}`)
            })
            .from(items)
            .where(and(
                eq(items.isActive, 1),
                ...baseConditions
            ))
            .groupBy(items.category);

        // Top selling items (based on order_items)
        const topSellingResult = await db
            .select({
                itemId: order_items.itemId,
                itemName: items.name,
                totalSold: sum(order_items.quantity),
                totalRevenue: sum(sql`${order_items.quantity} * ${order_items.unitPrice}`)
            })
            .from(order_items)
            .innerJoin(items, eq(order_items.itemId, items.id))
            .where(startDate && endDate ? sql`${order_items.createdAt} >= ${startDate} AND ${order_items.createdAt} <= ${endDate}` : undefined)
            .groupBy(order_items.itemId, items.name)
            .orderBy(desc(sum(order_items.quantity)))
            .limit(10);

        return {
            lowStockItems: lowStockResult,
            totalItems: inventoryStatsResult[0]?.totalItems || 0,
            totalInventoryValue: inventoryStatsResult[0]?.totalValue || 0,
            averageItemPrice: inventoryStatsResult[0]?.avgPrice || 0,
            categoryDistribution: categoryStatsResult,
            topSellingItems: topSellingResult
        };
    } catch (error) {
        console.error('Error fetching inventory analytics:', error);
        throw error;
    }
};

export const getUserAnalytics = async (startDate, endDate) => {
    try {
        // Base query conditions
        const baseConditions = [];

        if (startDate && endDate) {
            baseConditions.push(
                sql`${admins.createdAt} >= ${startDate} AND ${admins.createdAt} <= ${endDate}`
            );
        }

        // Total users by role
        const usersByRoleResult = await db
            .select({
                role: admins.role,
                count: count()
            })
            .from(admins)
            .where(and(...baseConditions))
            .groupBy(admins.role);

        // Recent registrations (within date range or last 30 days)
        let recentRegistrationsQuery = db
            .select({ count: count() })
            .from(admins);

        if (startDate && endDate) {
            recentRegistrationsQuery = recentRegistrationsQuery.where(
                sql`${admins.createdAt} >= ${startDate} AND ${admins.createdAt} <= ${endDate}`
            );
        } else {
            recentRegistrationsQuery = recentRegistrationsQuery.where(
                sql`${admins.createdAt} >= NOW() - INTERVAL '30 days'`
            );
        }

        const recentRegistrationsResult = await recentRegistrationsQuery;

        // Active customers (those who have placed orders)
        const activeCustomersResult = await db
            .select({ count: sql`COUNT(DISTINCT ${orders.customerId})` })
            .from(orders)
            .where(startDate && endDate ? sql`${orders.createdAt} >= ${startDate} AND ${orders.createdAt} <= ${endDate}` : undefined);

        return {
            usersByRole: usersByRoleResult.reduce((acc, curr) => {
                acc[curr.role] = curr.count;
                return acc;
            }, {}),
            recentRegistrations: recentRegistrationsResult[0]?.count || 0,
            activeCustomers: activeCustomersResult[0]?.count || 0
        };
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        throw error;
    }
};

export const getPaymentAnalytics = async (startDate, endDate) => {
    try {
        // Base query conditions for payments
        const paymentConditions = [eq(payments.status, 'completed')];
        const orderConditions = [];

        if (startDate && endDate) {
            paymentConditions.push(
                sql`${payments.createdAt} >= ${startDate} AND ${payments.createdAt} <= ${endDate}`
            );
            orderConditions.push(
                sql`${orders.createdAt} >= ${startDate} AND ${orders.createdAt} <= ${endDate}`
            );
        }

        // Payment method breakdown
        const paymentMethodsResult = await db
            .select({
                method: payments.method,
                count: count(),
                total: sum(payments.amount)
            })
            .from(payments)
            .where(and(...paymentConditions))
            .groupBy(payments.method);

        // Order status breakdown
        const orderStatusResult = await db
            .select({
                status: orders.status,
                count: count(),
                totalAmount: sum(orders.totalAmount)
            })
            .from(orders)
            .where(and(...orderConditions))
            .groupBy(orders.status);

        return {
            paymentMethods: paymentMethodsResult,
            orderStatus: orderStatusResult
        };
    } catch (error) {
        console.error('Error fetching payment analytics:', error);
        throw error;
    }
};
