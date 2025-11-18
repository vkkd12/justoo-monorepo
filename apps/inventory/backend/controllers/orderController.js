import { db } from '../db/index.js';
import { items as itemTable, orders as ordersTable, orderItems as orderItemsTable } from '@justoo/db';
import { eq, sql, desc, and, like } from 'drizzle-orm';

// Update item quantity when order is placed
export const processOrderPlacement = async (req, res) => {
    try {
        const { orderItems, notes, externalUserId, externalOrderId } = req.body; // Array of { itemId, quantity }

        // Use external user ID or default to system user (1)
        const userId = externalUserId || 1;

        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order items array is required and must not be empty'
            });
        }

        // Validate order items structure
        for (const item of orderItems) {
            if (!item.itemId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Each order item must have itemId and positive quantity'
                });
            }
        }

        const results = [];
        const errors = [];
        const orderItemsData = [];
        let totalAmount = 0;

        // Process each item in a transaction-like manner
        for (const orderItem of orderItems) {
            try {
                const { itemId, quantity } = orderItem;

                // Check if item exists and get current quantity
                const currentItem = await db.select().from(itemTable)
                    .where(eq(itemTable.id, parseInt(itemId)));

                if (currentItem.length === 0) {
                    errors.push({
                        itemId,
                        error: 'Item not found'
                    });
                    continue;
                }

                const item = currentItem[0];

                // Check if item is active
                if (item.isActive !== 1) {
                    errors.push({
                        itemId,
                        error: 'Item is not active'
                    });
                    continue;
                }

                // Check if enough quantity is available
                if (item.quantity < quantity) {
                    errors.push({
                        itemId,
                        error: `Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}`
                    });
                    continue;
                }

                // Calculate totals
                const itemTotal = parseFloat(item.price) * quantity;
                totalAmount += itemTotal;

                // Store order item data for later insertion
                orderItemsData.push({
                    itemId: parseInt(itemId),
                    itemName: item.name,
                    quantity: quantity,
                    unitPrice: item.price,
                    totalPrice: itemTotal.toFixed(2),
                    unit: item.unit
                });

                // Update quantity (subtract the ordered quantity)
                const newQuantity = item.quantity - quantity;
                const updatedItem = await db.update(itemTable)
                    .set({
                        quantity: newQuantity,
                        updatedAt: new Date()
                    })
                    .where(eq(itemTable.id, parseInt(itemId)))
                    .returning();

                results.push({
                    itemId,
                    previousQuantity: item.quantity,
                    orderedQuantity: quantity,
                    newQuantity: newQuantity,
                    item: updatedItem[0]
                });

            } catch (error) {
                errors.push({
                    itemId: orderItem.itemId,
                    error: error.message
                });
            }
        }

        // Return results if there were errors and no successful items
        if (errors.length > 0 && results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order processing failed',
                errors
            });
        }

        // Create order record if we have successful items
        let orderRecord = null;
        if (results.length > 0) {
            const orderData = {
                userId,
                status: 'placed',
                totalAmount: totalAmount.toFixed(2),
                itemCount: results.length,
                notes: notes || null
            };

            // Add external order ID to notes if provided
            if (externalOrderId) {
                orderData.notes = orderData.notes ?
                    `${orderData.notes} | External Order ID: ${externalOrderId}` :
                    `External Order ID: ${externalOrderId}`;
            }

            const newOrder = await db.insert(ordersTable).values(orderData).returning();

            orderRecord = newOrder[0];

            // Insert order items
            for (const orderItemData of orderItemsData) {
                await db.insert(orderItemsTable).values({
                    orderId: orderRecord.id,
                    ...orderItemData
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Order processed. ${results.length} items updated successfully.`,
            data: {
                order: orderRecord,
                successful: results,
                failed: errors
            }
        });

    } catch (error) {
        console.error('Error processing order placement:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};// Update item quantity when order is cancelled
export const processOrderCancellation = async (req, res) => {
    try {
        const { orderItems } = req.body; // Array of { itemId, quantity }

        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order items array is required and must not be empty'
            });
        }

        // Validate order items structure
        for (const item of orderItems) {
            if (!item.itemId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Each order item must have itemId and positive quantity'
                });
            }
        }

        const results = [];
        const errors = [];

        // Process each item
        for (const orderItem of orderItems) {
            try {
                const { itemId, quantity } = orderItem;

                // Check if item exists
                const currentItem = await db.select().from(itemTable)
                    .where(eq(itemTable.id, parseInt(itemId)));

                if (currentItem.length === 0) {
                    errors.push({
                        itemId,
                        error: 'Item not found'
                    });
                    continue;
                }

                const item = currentItem[0];

                // Update quantity (add back the cancelled quantity)
                const newQuantity = item.quantity + quantity;
                const updatedItem = await db.update(itemTable)
                    .set({
                        quantity: newQuantity,
                        updatedAt: new Date()
                    })
                    .where(eq(itemTable.id, parseInt(itemId)))
                    .returning();

                results.push({
                    itemId,
                    previousQuantity: item.quantity,
                    cancelledQuantity: quantity,
                    newQuantity: newQuantity,
                    item: updatedItem[0]
                });

            } catch (error) {
                errors.push({
                    itemId: orderItem.itemId,
                    error: error.message
                });
            }
        }

        // Return results
        if (errors.length > 0 && results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order cancellation processing failed',
                errors
            });
        }

        res.status(200).json({
            success: true,
            message: `Order cancellation processed. ${results.length} items updated successfully.`,
            data: {
                successful: results,
                failed: errors
            }
        });

    } catch (error) {
        console.error('Error processing order cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Bulk update quantities (for restocking or adjustments)
export const bulkUpdateQuantities = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { itemId, quantity, operation: 'set' | 'add' | 'subtract' }

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Updates array is required and must not be empty'
            });
        }

        // Validate updates structure
        for (const update of updates) {
            if (!update.itemId || update.quantity === undefined || !update.operation) {
                return res.status(400).json({
                    success: false,
                    message: 'Each update must have itemId, quantity, and operation (set/add/subtract)'
                });
            }

            if (!['set', 'add', 'subtract'].includes(update.operation)) {
                return res.status(400).json({
                    success: false,
                    message: 'Operation must be either "set", "add", or "subtract"'
                });
            }

            if (update.quantity < 0 && update.operation === 'set') {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity cannot be negative when operation is "set"'
                });
            }
        }

        const results = [];
        const errors = [];

        // Process each update
        for (const update of updates) {
            try {
                const { itemId, quantity, operation } = update;

                // Check if item exists
                const currentItem = await db.select().from(itemTable)
                    .where(eq(itemTable.id, parseInt(itemId)));

                if (currentItem.length === 0) {
                    errors.push({
                        itemId,
                        error: 'Item not found'
                    });
                    continue;
                }

                const item = currentItem[0];
                let newQuantity;

                // Calculate new quantity based on operation
                switch (operation) {
                    case 'set':
                        newQuantity = quantity;
                        break;
                    case 'add':
                        newQuantity = item.quantity + quantity;
                        break;
                    case 'subtract':
                        newQuantity = item.quantity - quantity;
                        if (newQuantity < 0) {
                            errors.push({
                                itemId,
                                error: `Cannot subtract ${quantity} from current quantity ${item.quantity}. Result would be negative.`
                            });
                            continue;
                        }
                        break;
                }

                // Update the item
                const updatedItem = await db.update(itemTable)
                    .set({
                        quantity: newQuantity,
                        updatedAt: new Date()
                    })
                    .where(eq(itemTable.id, parseInt(itemId)))
                    .returning();

                results.push({
                    itemId,
                    operation,
                    previousQuantity: item.quantity,
                    changeAmount: quantity,
                    newQuantity: newQuantity,
                    item: updatedItem[0]
                });

            } catch (error) {
                errors.push({
                    itemId: update.itemId,
                    error: error.message
                });
            }
        }

        // Return results
        if (errors.length > 0 && results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bulk update failed',
                errors
            });
        }

        res.status(200).json({
            success: true,
            message: `Bulk update processed. ${results.length} items updated successfully.`,
            data: {
                successful: results,
                failed: errors
            }
        });

    } catch (error) {
        console.error('Error processing bulk update:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Check stock availability for multiple items (useful before placing orders)
export const checkStockAvailability = async (req, res) => {
    try {
        const { items } = req.body; // Array of { itemId, requiredQuantity }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required and must not be empty'
            });
        }

        const results = [];
        const unavailableItems = [];

        for (const checkItem of items) {
            const { itemId, requiredQuantity } = checkItem;

            if (!itemId || !requiredQuantity || requiredQuantity <= 0) {
                continue; // Skip invalid items
            }

            // Get current item
            const currentItem = await db.select().from(itemTable)
                .where(eq(itemTable.id, parseInt(itemId)));

            if (currentItem.length === 0) {
                unavailableItems.push({
                    itemId,
                    reason: 'Item not found'
                });
                continue;
            }

            const item = currentItem[0];

            if (item.isActive !== 1) {
                unavailableItems.push({
                    itemId,
                    reason: 'Item is not active'
                });
                continue;
            }

            const isAvailable = item.quantity >= requiredQuantity;

            results.push({
                itemId,
                itemName: item.name,
                currentQuantity: item.quantity,
                requiredQuantity,
                isAvailable,
                shortfall: isAvailable ? 0 : requiredQuantity - item.quantity
            });

            if (!isAvailable) {
                unavailableItems.push({
                    itemId,
                    reason: `Insufficient stock. Available: ${item.quantity}, Required: ${requiredQuantity}`
                });
            }
        }

        const allAvailable = unavailableItems.length === 0;

        res.status(200).json({
            success: true,
            data: {
                allAvailable,
                stockCheck: results,
                unavailableItems
            }
        });

    } catch (error) {
        console.error('Error checking stock availability:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all orders with details (for viewing order history)
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, userId, externalUserId } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];

        // Filter by userId if provided (for external backend to query specific user's orders)
        if (userId) {
            whereConditions.push(eq(ordersTable.userId, parseInt(userId)));
        }

        // Filter by externalUserId (search in notes field)
        if (externalUserId) {
            whereConditions.push(sql`${ordersTable.notes} LIKE ${`%External Order ID: ${externalUserId}%`}`);
        }

        // Filter by status if provided
        if (status) {
            whereConditions.push(eq(ordersTable.status, status));
        }

        const finalWhereCondition = whereConditions.length > 0 ?
            (whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)) :
            undefined;

        // Get orders
        const orders = await db.select().from(ordersTable)
            .where(finalWhereCondition)
            .limit(parseInt(limit))
            .offset(offset)
            .orderBy(desc(ordersTable.createdAt));

        // Get total count for pagination
        const totalCount = await db.select({ count: sql`count(*)` }).from(ordersTable)
            .where(finalWhereCondition);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount[0].count),
                totalPages: Math.ceil(parseInt(totalCount[0].count) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get specific order with items
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, externalUserId } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        let whereConditions = [eq(ordersTable.id, parseInt(id))];

        // Filter by userId if provided (for external backend to ensure access control)
        if (userId) {
            whereConditions.push(eq(ordersTable.userId, parseInt(userId)));
        }

        // Filter by externalUserId (search in notes field)
        if (externalUserId) {
            whereConditions.push(sql`${ordersTable.notes} LIKE ${`%External Order ID: ${externalUserId}%`}`);
        }

        const whereCondition = whereConditions.length === 1 ?
            whereConditions[0] :
            and(...whereConditions);

        const order = await db.select().from(ordersTable)
            .where(whereCondition);

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Get order items
        const orderItems = await db.select().from(orderItemsTable)
            .where(eq(orderItemsTable.orderId, parseInt(id)))
            .orderBy(orderItemsTable.createdAt);

        res.status(200).json({
            success: true,
            data: {
                order: order[0],
                items: orderItems
            }
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get order by external order ID
export const getOrderByExternalId = async (req, res) => {
    try {
        const { externalId } = req.params;

        if (!externalId) {
            return res.status(400).json({
                success: false,
                message: 'External order ID is required'
            });
        }

        // Search for order by external ID in notes field
        const order = await db.select().from(ordersTable)
            .where(sql`${ordersTable.notes} LIKE ${`%External Order ID: ${externalId}%`}`);

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found with the provided external ID'
            });
        }

        // Get order items for the found order
        const orderItems = await db.select().from(orderItemsTable)
            .where(eq(orderItemsTable.orderId, order[0].id))
            .orderBy(orderItemsTable.createdAt);

        res.status(200).json({
            success: true,
            data: {
                order: order[0],
                items: orderItems
            }
        });

    } catch (error) {
        console.error('Error fetching order by external ID:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
