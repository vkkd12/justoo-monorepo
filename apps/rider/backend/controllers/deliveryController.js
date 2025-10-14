import { db } from "../db/index.js";
import { orders } from "../../../../packages/db/schema.js";
import { eq, and, sql } from "drizzle-orm";

// 1. Start delivery for an order
export const startDelivery = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;
        const { estimatedDeliveryTime } = req.body;

        // Check if order exists and is assigned to this rider
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    eq(orders.riderId, riderId),
                    sql`${orders.status} IN ('ready', 'confirmed', 'preparing')`
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not ready for delivery",
            });
        }

        // Update order status to out_for_delivery
        const updatedOrder = await db
            .update(orders)
            .set({
                status: 'out_for_delivery',
                estimatedDeliveryTime: estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : null,
                actualDeliveryTime: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(orders.id, parseInt(orderId)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Delivery started successfully",
            order: updatedOrder[0],
        });
    } catch (error) {
        console.error("Error starting delivery:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 2. Complete delivery
export const completeDelivery = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;
        const { deliveryNotes, customerSignature, deliveryPhoto } = req.body;

        // Check if order exists and is assigned to this rider
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    eq(orders.riderId, riderId),
                    eq(orders.status, 'out_for_delivery')
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not out for delivery",
            });
        }

        // Update order status to delivered
        const deliveredAt = new Date();
        const updatedOrder = await db
            .update(orders)
            .set({
                status: 'delivered',
                deliveredAt,
                deliveryNotes,
                customerSignature,
                deliveryPhoto,
                updatedAt: deliveredAt,
            })
            .where(eq(orders.id, parseInt(orderId)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Delivery completed successfully",
            order: updatedOrder[0],
        });
    } catch (error) {
        console.error("Error completing delivery:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 3. Mark delivery as failed
export const failDelivery = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;
        const { failureReason, failureNotes } = req.body;

        // Validation
        if (!failureReason) {
            return res.status(400).json({
                success: false,
                message: "Failure reason is required",
            });
        }

        // Check if order exists and is assigned to this rider
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    eq(orders.riderId, riderId),
                    eq(orders.status, 'out_for_delivery')
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not out for delivery",
            });
        }

        // Update order status to cancelled (since 'failed' is not a valid status)
        const updatedOrder = await db
            .update(orders)
            .set({
                status: 'cancelled',
                deliveryNotes: failureNotes,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, parseInt(orderId)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Delivery marked as failed",
            order: updatedOrder[0],
        });
    } catch (error) {
        console.error("Error marking delivery as failed:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 4. Get delivery history for rider
export const getDeliveryHistory = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;

        const offset = (page - 1) * limit;

        let query = db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    sql`${orders.status} IN ('delivered', 'cancelled')`
                )
            );

        // Filter by status if provided
        if (status) {
            query = query.where(eq(orders.status, status));
        }

        // Order by delivery date (newest first)
        query = query.orderBy(sql`${orders.deliveredAt} DESC`);

        // Apply pagination
        const deliveryHistory = await query.limit(parseInt(limit)).offset(offset);

        // Get total count for pagination
        let countQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    sql`${orders.status} IN ('delivered', 'cancelled')`
                )
            );

        if (status) {
            countQuery = countQuery.where(eq(orders.status, status));
        }

        const totalResult = await countQuery;
        const totalDeliveries = parseInt(totalResult[0].count);

        res.status(200).json({
            success: true,
            deliveries: deliveryHistory,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalDeliveries / limit),
                totalItems: totalDeliveries,
                itemsPerPage: parseInt(limit),
                hasNext: page * limit < totalDeliveries,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching delivery history:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 5. Get delivery statistics for rider
export const getDeliveryStats = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { period = 'month' } = req.query; // day, week, month, year

        let dateFilter;
        const now = new Date();

        switch (period) {
            case 'day':
                dateFilter = sql`DATE(${orders.deliveredAt}) = CURRENT_DATE`;
                break;
            case 'week':
                dateFilter = sql`${orders.deliveredAt} >= CURRENT_DATE - INTERVAL '7 days'`;
                break;
            case 'month':
                dateFilter = sql`${orders.deliveredAt} >= CURRENT_DATE - INTERVAL '30 days'`;
                break;
            case 'year':
                dateFilter = sql`${orders.deliveredAt} >= CURRENT_DATE - INTERVAL '365 days'`;
                break;
            default:
                dateFilter = sql`${orders.deliveredAt} >= CURRENT_DATE - INTERVAL '30 days'`;
        }

        // Get delivery statistics
        const stats = await db
            .select({
                totalDeliveries: sql`COUNT(*)`,
                successfulDeliveries: sql`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
                failedDeliveries: sql`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`,
                cancelledDeliveries: sql`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`,
                averageDeliveryTime: sql`AVG(EXTRACT(EPOCH FROM ("delivered_at" - "actual_delivery_time")) / 60)`, // in minutes
                totalEarnings: sql`SUM(${orders.deliveryFee})`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    dateFilter
                )
            );

        res.status(200).json({
            success: true,
            stats: stats[0],
            period,
        });
    } catch (error) {
        console.error("Error fetching delivery stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 6. Update delivery location/progress
export const updateDeliveryProgress = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;
        const { latitude, longitude, progressNotes } = req.body;

        // Check if order exists and is assigned to this rider
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    eq(orders.riderId, riderId),
                    eq(orders.status, 'out_for_delivery')
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not out for delivery",
            });
        }

        // Update delivery progress (you might want to create a separate delivery_progress table for this)
        // For now, we'll update the order with progress notes
        const updatedOrder = await db
            .update(orders)
            .set({
                deliveryNotes: progressNotes,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, parseInt(orderId)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Delivery progress updated successfully",
            order: updatedOrder[0],
        });
    } catch (error) {
        console.error("Error updating delivery progress:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};