import { db } from "../db/index.js";
import { orders, orderItems, customerAddresses } from "../../../../packages/db/schema.js";
import { eq, and, sql, inArray } from "drizzle-orm";

// 0. Get available orders for riders to accept
export const getAvailableOrders = async (req, res) => {
    try {
        // Get orders that are placed and not yet assigned to any rider
        const availableOrders = await db
            .select({
                id: orders.id,
                customerId: orders.customerId,
                status: orders.status,
                totalAmount: orders.totalAmount,
                itemCount: orders.itemCount,
                subtotal: orders.subtotal,
                deliveryFee: orders.deliveryFee,
                taxAmount: orders.taxAmount,
                orderPlacedAt: orders.orderPlacedAt,
                estimatedDeliveryTime: orders.estimatedDeliveryTime,
                deliveryAddressId: orders.deliveryAddressId
            })
            .from(orders)
            .where(
                and(
                    eq(orders.status, 'placed'),
                    sql`${orders.riderId} IS NULL`
                )
            )
            .orderBy(sql`${orders.orderPlacedAt} DESC`);

        // Get delivery addresses for the orders
        const deliveryAddressIds = availableOrders.map(order => order.deliveryAddressId);
        let deliveryAddresses = [];

        if (deliveryAddressIds.length > 0) {
            deliveryAddresses = await db
                .select()
                .from(customerAddresses)
                .where(inArray(customerAddresses.id, deliveryAddressIds));
        }

        // Combine orders with their delivery addresses
        const ordersWithAddresses = availableOrders.map(order => ({
            ...order,
            deliveryAddress: deliveryAddresses.find(addr => addr.id === order.deliveryAddressId) || null
        }));

        res.status(200).json({
            success: true,
            orders: ordersWithAddresses,
        });
    } catch (error) {
        console.error("Error fetching available orders:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 1. Get the current order assigned to the rider (status: out_for_delivery or ready, etc.)
export const getCurrentOrderForRider = async (req, res) => {
    try {
        const riderId = req.user.userId;
        // Get orders that are assigned to this rider and are in progress
        const currentOrder = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    sql`${orders.status} IN ('confirmed', 'preparing', 'ready', 'out_for_delivery')`
                )
            )
            .orderBy(sql`${orders.orderPlacedAt} DESC`)
            .limit(1);

        if (currentOrder.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No current order assigned to this rider.",
            });
        }

        // Get order items
        const orderItemsList = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, currentOrder[0].id));

        // Get delivery address
        const deliveryAddress = await db
            .select()
            .from(customerAddresses)
            .where(eq(customerAddresses.id, currentOrder[0].deliveryAddressId));

        res.status(200).json({
            success: true,
            order: {
                ...currentOrder[0],
                items: orderItemsList,
                deliveryAddress: deliveryAddress[0] || null,
            },
        });
    } catch (error) {
        console.error("Error fetching current order for rider:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 2. Get all orders assigned to the rider
export const getAssignedOrdersForRider = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        let query = db
            .select()
            .from(orders)
            .where(eq(orders.riderId, riderId));

        // Filter by status if provided
        if (status) {
            query = query.where(eq(orders.status, status));
        }

        // Order by creation date (newest first)
        query = query.orderBy(sql`${orders.orderPlacedAt} DESC`);

        // Apply pagination
        const assignedOrders = await query.limit(parseInt(limit)).offset(offset);

        // Get total count for pagination
        let countQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(orders)
            .where(eq(orders.riderId, riderId));

        if (status) {
            countQuery = countQuery.where(eq(orders.status, status));
        }

        const totalResult = await countQuery;
        const totalOrders = parseInt(totalResult[0].count);

        res.status(200).json({
            success: true,
            orders: assignedOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalItems: totalOrders,
                itemsPerPage: parseInt(limit),
                hasNext: page * limit < totalOrders,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching assigned orders for rider:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 3. Get all completed orders for the rider
export const getCompletedOrdersForRider = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const completedOrders = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    eq(orders.status, "delivered")
                )
            )
            .orderBy(sql`${orders.deliveredAt} DESC`)
            .limit(parseInt(limit))
            .offset(offset);

        // Get total count
        const totalResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    eq(orders.status, "delivered")
                )
            );

        const totalOrders = parseInt(totalResult[0].count);

        res.status(200).json({
            success: true,
            orders: completedOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalItems: totalOrders,
                itemsPerPage: parseInt(limit),
                hasNext: page * limit < totalOrders,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching completed orders for rider:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 4. Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;
        const { status, notes } = req.body;

        // Validation
        const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: confirmed, preparing, ready, out_for_delivery, delivered, cancelled",
            });
        }

        // Check if order exists and is assigned to this rider
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    eq(orders.riderId, riderId)
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not assigned to this rider",
            });
        }

        // Update order status
        const updateData = {
            status,
            updatedAt: new Date(),
        };

        // Set delivered timestamp if status is delivered
        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
            updateData.actualDeliveryTime = new Date();
        }

        // Set out for delivery timestamp
        if (status === 'out_for_delivery') {
            updateData.actualDeliveryTime = new Date();
        }

        const updatedOrder = await db
            .update(orders)
            .set(updateData)
            .where(eq(orders.id, parseInt(orderId)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order: updatedOrder[0],
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 5. Accept order assignment
export const acceptOrder = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;

        // Check if order exists and is available for assignment
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    sql`${orders.status} IN ('placed', 'confirmed')`,
                    sql`${orders.riderId} IS NULL`
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or already assigned",
            });
        }

        // Assign order to rider
        const updatedOrder = await db
            .update(orders)
            .set({
                riderId: riderId,
                status: 'confirmed',
                updatedAt: new Date(),
            })
            .where(eq(orders.id, parseInt(orderId)))
            .returning();

        res.status(200).json({
            success: true,
            message: "Order accepted successfully",
            order: updatedOrder[0],
        });
    } catch (error) {
        console.error("Error accepting order:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 6. Get order details by ID
export const getOrderDetails = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { orderId } = req.params;

        // Get order with rider verification
        const order = await db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, parseInt(orderId)),
                    eq(orders.riderId, riderId)
                )
            );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not assigned to this rider",
            });
        }

        // Get order items
        const orderItemsList = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, parseInt(orderId)));

        // Get delivery address
        const deliveryAddress = await db
            .select()
            .from(customerAddresses)
            .where(eq(customerAddresses.id, order[0].deliveryAddressId));

        res.status(200).json({
            success: true,
            order: {
                ...order[0],
                items: orderItemsList,
                deliveryAddress: deliveryAddress[0] || null,
            },
        });
    } catch (error) {
        console.error("Error getting order details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
