import db from '../config/dbConfig.js';
import { orders, orderItems, items, customerAddresses, justooPayments, riderNotifications, justooRiders } from '@justoo/db';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { successResponse, errorResponse, getPaginationData, generateOrderNumber } from '../utils/response.js';
import { carts } from './cartController.js';

// Create new order
export const createOrder = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const {
            deliveryAddressId,
            paymentMethod = 'cash',
            specialInstructions,
            notes
        } = req.body;

        // Get customer's cart
        const cart = carts.get(customerId); if (!cart || cart.items.length === 0) {
            console.log("Cart is empty");
            return errorResponse(res, 'Cart is empty', 400);
        }

        // Validate delivery address
        if (!deliveryAddressId) {
            console.log("Delivery address is required");
            return errorResponse(res, 'Delivery address is required', 400);
        }

        const address = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.id, parseInt(deliveryAddressId)),
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isActive} = 1`
            ))
            .limit(1);

        if (address.length === 0) {
            console.log("Invalid delivery address");
            return errorResponse(res, 'Invalid delivery address', 400);
        }

        // Validate cart items availability
        for (const cartItem of cart.items) {
            const item = await db
                .select()
                .from(items)
                .where(and(
                    eq(items.id, cartItem.id),
                    sql`${items.isActive} = 1`,
                    sql`${items.quantity} >= ${cartItem.quantity}`
                ))
                .limit(1);

            if (item.length === 0) {
                return errorResponse(res, `Item "${cartItem.name}" is no longer available or insufficient stock`, 400);
            }
        }

        // Calculate order totals (simplified - no distance-based zones needed)
        const subtotal = cart.total;
        const deliveryFee = subtotal < 100 ? 40 : 0; // 40 rs delivery fee if order < 100
        const totalAmount = subtotal + deliveryFee;

        // Use default delivery time (15 minutes)
        const defaultDeliveryTime = 15;

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Start transaction
        const newOrder = await db.transaction(async (tx) => {
            // Create order
            const order = await tx
                .insert(orders)
                .values({
                    customerId,
                    deliveryAddressId: parseInt(deliveryAddressId),
                    status: 'placed',
                    totalAmount,
                    itemCount: cart.itemCount,
                    subtotal,
                    deliveryFee,
                    taxAmount,
                    notes,
                    specialInstructions,
                    estimatedDeliveryTime: new Date(Date.now() + defaultDeliveryTime * 60 * 1000),
                    orderPlacedAt: new Date()
                })
                .returning();

            // Create order items
            const orderItemsData = cart.items.map(cartItem => ({
                orderId: order[0].id,
                itemId: cartItem.id,
                itemName: cartItem.name,
                quantity: cartItem.quantity,
                unitPrice: cartItem.price,
                totalPrice: cartItem.totalPrice,
                unit: cartItem.unit
            }));

            await tx.insert(orderItems).values(orderItemsData);

            // Update item quantities
            for (const cartItem of cart.items) {
                await tx
                    .update(items)
                    .set({
                        quantity: sql`${items.quantity} - ${cartItem.quantity}`,
                        updatedAt: new Date()
                    })
                    .where(eq(items.id, cartItem.id));
            }

            // Create payment record
            await tx
                .insert(justooPayments)
                .values({
                    orderId: order[0].id,
                    amount: totalAmount,
                    method: paymentMethod,
                    status: paymentMethod === 'cash' ? 'pending' : 'completed'
                });

            return order[0];
        });

        // Clear customer's cart
        carts.delete(customerId);

        // Create notifications for all active riders
        try {
            const activeRiders = await db
                .select({ id: justooRiders.id, name: justooRiders.name })
                .from(justooRiders)
                .where(
                    and(
                        eq(justooRiders.isActive, 1),
                        eq(justooRiders.status, 'active')
                    )
                );

            if (activeRiders.length > 0) {
                const notifications = activeRiders.map(rider => ({
                    riderId: rider.id,
                    type: 'order',
                    title: 'New Order Available',
                    message: `A new order #${orderNumber} is available for delivery. Total: ₹${totalAmount}`,
                    data: JSON.stringify({
                        orderId: newOrder.id,
                        orderNumber,
                        totalAmount,
                        itemCount: cart.itemCount,
                        deliveryAddress: address[0]
                    }),
                    sentAt: new Date()
                }));

                await db.insert(riderNotifications).values(notifications);
            }
        } catch (notificationError) {
            console.error('Error creating rider notifications:', notificationError);
            // Don't fail the order creation if notifications fail
        }

        // Get complete order details
        const orderDetails = await getOrderDetails(newOrder.id);

        return successResponse(res, 'Order placed successfully', {
            order: orderDetails,
            orderNumber,
            estimatedDelivery: defaultDeliveryTime
        }, 201);
    } catch (error) {
        console.error('Create order error:', error);
        return errorResponse(res, 'Failed to place order', 500);
    }
};

// Get customer's orders
export const getCustomerOrders = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;
        let query = db
            .select({
                id: orders.id,
                status: orders.status,
                totalAmount: orders.totalAmount,
                itemCount: orders.itemCount,
                orderPlacedAt: orders.orderPlacedAt,
                estimatedDeliveryTime: orders.estimatedDeliveryTime,
                actualDeliveryTime: orders.actualDeliveryTime,
                deliveredAt: orders.deliveredAt
            })
            .from(orders)
            .where(eq(orders.customerId, customerId));

        // Apply status filter
        if (status) {
            query = query.where(eq(orders.status, status));
        }

        // Apply sorting
        const validSortFields = ['orderPlacedAt', 'totalAmount', 'status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'orderPlacedAt';
        const order = sortOrder === 'desc' ? desc : sql`asc`;
        query = query.orderBy(order(orders[sortField]));

        const customerOrders = await query.limit(parseInt(limit)).offset(offset);

        // Get total count
        let countQuery = db
            .select({ count: sql`count(*)` })
            .from(orders)
            .where(eq(orders.customerId, customerId));

        if (status) {
            countQuery = countQuery.where(eq(orders.status, status));
        }

        const totalResult = await countQuery;
        const totalOrders = parseInt(totalResult[0].count);
        const pagination = getPaginationData(page, limit, totalOrders);

        return successResponse(res, 'Orders retrieved successfully', {
            orders: customerOrders,
            pagination
        });
    } catch (error) {
        console.error('Get customer orders error:', error);
        return errorResponse(res, 'Failed to retrieve orders', 500);
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { orderId } = req.params;

        const order = await db
            .select()
            .from(orders)
            .where(and(
                eq(orders.id, parseInt(orderId)),
                eq(orders.customerId, customerId)
            ))
            .limit(1);

        if (order.length === 0) {
            return errorResponse(res, 'Order not found', 404);
        }

        const orderDetails = await getOrderDetails(orderId);

        return successResponse(res, 'Order retrieved successfully', orderDetails);
    } catch (error) {
        console.error('Get order by ID error:', error);
        return errorResponse(res, 'Failed to retrieve order', 500);
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { orderId } = req.params;

        const order = await db
            .select()
            .from(orders)
            .where(and(
                eq(orders.id, parseInt(orderId)),
                eq(orders.customerId, customerId)
            ))
            .limit(1);

        if (order.length === 0) {
            return errorResponse(res, 'Order not found', 404);
        }

        if (!['placed', 'confirmed'].includes(order[0].status)) {
            return errorResponse(res, 'Order cannot be cancelled at this stage', 400);
        }

        // Start transaction
        await db.transaction(async (tx) => {
            // Update order status
            await tx
                .update(orders)
                .set({
                    status: 'cancelled',
                    updatedAt: new Date()
                })
                .where(eq(orders.id, parseInt(orderId)));

            // Restock items
            const orderItemsList = await tx
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, parseInt(orderId)));

            for (const orderItem of orderItemsList) {
                await tx
                    .update(items)
                    .set({
                        quantity: sql`${items.quantity} + ${orderItem.quantity}`,
                        updatedAt: new Date()
                    })
                    .where(eq(items.id, orderItem.itemId));
            }
        });

        return successResponse(res, 'Order cancelled successfully');
    } catch (error) {
        console.error('Cancel order error:', error);
        return errorResponse(res, 'Failed to cancel order', 500);
    }
};

// Get order details helper function
const getOrderDetails = async (orderId) => {
    const order = await db
        .select({
            id: orders.id,
            customerId: orders.customerId,
            deliveryAddressId: orders.deliveryAddressId,
            status: orders.status,
            totalAmount: orders.totalAmount,
            itemCount: orders.itemCount,
            subtotal: orders.subtotal,
            deliveryFee: orders.deliveryFee,
            taxAmount: orders.taxAmount,
            discountAmount: orders.discountAmount,
            notes: orders.notes,
            specialInstructions: orders.specialInstructions,
            riderId: orders.riderId,
            estimatedDeliveryTime: orders.estimatedDeliveryTime,
            actualDeliveryTime: orders.actualDeliveryTime,
            deliveredAt: orders.deliveredAt,
            orderPlacedAt: orders.orderPlacedAt,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt
        })
        .from(orders)
        .where(eq(orders.id, parseInt(orderId)))
        .limit(1);

    if (order.length === 0) return null;

    // Get order items
    const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, parseInt(orderId)));

    // Get delivery address
    const address = await db
        .select()
        .from(customerAddresses)
        .where(eq(customerAddresses.id, order[0].deliveryAddressId))
        .limit(1);

    // Get payment info
    const payment = await db
        .select()
        .from(justooPayments)
        .where(eq(justooPayments.orderId, parseInt(orderId)))
        .limit(1);

    return {
        ...order[0],
        items,
        deliveryAddress: address[0] || null,
        payment: payment[0] || null
    };
};

// Get order statistics
export const getOrderStats = async (req, res) => {
    try {
        const customerId = req.customer.id;

        const stats = await db
            .select({
                totalOrders: sql`count(*)`,
                totalSpent: sql`sum(${orders.totalAmount})`,
                avgOrderValue: sql`avg(${orders.totalAmount})`,
                lastOrderDate: sql`max(${orders.orderPlacedAt})`
            })
            .from(orders)
            .where(eq(orders.customerId, customerId));

        const orderStatusCounts = await db
            .select({
                status: orders.status,
                count: sql`count(*)`
            })
            .from(orders)
            .where(eq(orders.customerId, customerId))
            .groupBy(orders.status);

        return successResponse(res, 'Order statistics retrieved successfully', {
            overview: stats[0],
            statusBreakdown: orderStatusCounts
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        return errorResponse(res, 'Failed to retrieve order statistics', 500);
    }
};