import db from '../config/dbConfig.js';
import { items, orders, orderItems } from '@justoo/db';
import { eq, and, count, sum, avg, desc, asc, sql, gt, lt, isNull } from 'drizzle-orm';
import { errorResponse, successResponse } from '../utils/response.js';
import { uploadImage, deleteImage, processItemsImages, processItemImage } from '../config/cloudinary.js';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Valid units enum
export const VALID_UNITS = ['kg', 'grams', 'ml', 'litre', 'pieces', 'dozen', 'packet', 'bottle', 'can'];

// Get all items with pagination and filtering
export const getAllItems = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            isActive,
            sortBy = 'name',
            sortOrder = 'asc',
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let query = db.select().from(items);

        // Apply filters
        const conditions = [];

        if (category) {
            conditions.push(eq(items.category, category));
        }

        if (isActive !== undefined) {
            conditions.push(eq(items.isActive, parseInt(isActive)));
        }

        if (search) {
            conditions.push(sql`${items.name} ILIKE ${'%' + search + '%'}`);
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Apply sorting
        const sortColumn = items[sortBy] || items.name;
        query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

        // Apply pagination
        const itemsList = await query.limit(parseInt(limit)).offset(offset);

        // Get total count for pagination
        let countQuery = db.select({ count: count() }).from(items);
        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }
        const totalItems = await countQuery;

        // Process images for admin response
        const processedItems = processItemsImages(itemsList);

        return successResponse(res, 'Items retrieved successfully', {
            items: processedItems,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems[0].count / limit),
                totalItems: totalItems[0].count,
                hasNext: page * limit < totalItems[0].count,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error getting items:', error);
        return errorResponse(res, 'Failed to retrieve items', 500);
    }
};

// Get comprehensive inventory analytics
export const getInventoryAnalytics = async (req, res) => {
    try {
        // 1. Stock Level Analytics
        const stockAnalytics = await getStockLevelAnalytics();

        // 2. Financial Analytics
        const financialAnalytics = await getFinancialAnalytics();

        // 3. Performance Analytics
        const performanceAnalytics = await getPerformanceAnalytics();

        // 4. Category Analytics
        const categoryAnalytics = await getCategoryAnalytics();

        const analytics = {
            stockLevels: stockAnalytics,
            financial: financialAnalytics,
            performance: performanceAnalytics,
            categories: categoryAnalytics,
            timestamp: new Date().toISOString()
        };

        return successResponse(res, 'Inventory analytics retrieved successfully', analytics);
    } catch (error) {
        console.error('Error getting inventory analytics:', error);
        return errorResponse(res, 'Failed to retrieve inventory analytics', 500);
    }
};

// Stock Level Analytics Helper
const getStockLevelAnalytics = async () => {
    // Low stock items (quantity <= minStockLevel)
    const lowStockItemsRaw = await db
        .select()
        .from(items)
        .where(and(
            sql`${items.quantity} <= ${items.minStockLevel}`,
            eq(items.isActive, 1)
        ));

    // Out of stock items
    const outOfStockItemsRaw = await db
        .select()
        .from(items)
        .where(and(
            eq(items.quantity, 0),
            eq(items.isActive, 1)
        ));

    // Overstock items (quantity > minStockLevel * 5)
    const overstockItemsRaw = await db
        .select()
        .from(items)
        .where(and(
            sql`${items.quantity} > ${items.minStockLevel} * 5`,
            eq(items.isActive, 1)
        ));

    // Process images for these items
    const lowStockItems = processItemsImages(lowStockItemsRaw);
    const outOfStockItems = processItemsImages(outOfStockItemsRaw);
    const overstockItems = processItemsImages(overstockItemsRaw);

    // Total active items
    const totalActiveItems = await db
        .select({ count: count() })
        .from(items)
        .where(eq(items.isActive, 1));

    const total = totalActiveItems[0].count;

    return {
        lowStock: {
            items: lowStockItems,
            count: lowStockItems.length,
            percentage: total > 0 ? ((lowStockItems.length / total) * 100).toFixed(2) : 0
        },
        outOfStock: {
            items: outOfStockItems,
            count: outOfStockItems.length,
            percentage: total > 0 ? ((outOfStockItems.length / total) * 100).toFixed(2) : 0
        },
        overstock: {
            items: overstockItems,
            count: overstockItems.length,
            percentage: total > 0 ? ((overstockItems.length / total) * 100).toFixed(2) : 0
        },
        normal: {
            count: total - lowStockItems.length - outOfStockItems.length - overstockItems.length,
            percentage: total > 0 ? (((total - lowStockItems.length - outOfStockItems.length - overstockItems.length) / total) * 100).toFixed(2) : 0
        },
        totalItems: total
    };
};

// Financial Analytics Helper
const getFinancialAnalytics = async () => {
    const financialData = await db
        .select({
            totalValue: sum(sql`${items.price} * ${items.quantity}`),
            totalItems: count(),
            avgPrice: avg(items.price),
            maxPrice: sql`MAX(${items.price})`,
            minPrice: sql`MIN(${items.price})`
        })
        .from(items)
        .where(eq(items.isActive, 1));

    // Most expensive items
    const mostExpensiveRaw = await db
        .select()
        .from(items)
        .where(eq(items.isActive, 1))
        .orderBy(desc(items.price))
        .limit(5);

    // Least expensive items
    const leastExpensiveRaw = await db
        .select()
        .from(items)
        .where(eq(items.isActive, 1))
        .orderBy(asc(items.price))
        .limit(5);

    // Process images for these items
    const mostExpensive = processItemsImages(mostExpensiveRaw);
    const leastExpensive = processItemsImages(leastExpensiveRaw);

    // Price range distribution
    const priceRanges = await db
        .select({
            range: sql`
                CASE 
                    WHEN ${items.price} <= 100 THEN 'Under ₹100'
                    WHEN ${items.price} <= 500 THEN '₹100 - ₹500'
                    WHEN ${items.price} <= 2000 THEN '₹500 - ₹2000'
                    ELSE 'Over ₹2000'
                END
            `,
            count: count(),
            totalValue: sum(sql`${items.price} * ${items.quantity}`)
        })
        .from(items)
        .where(eq(items.isActive, 1))
        .groupBy(sql`
            CASE 
                WHEN ${items.price} <= 100 THEN 'Under ₹100'
                WHEN ${items.price} <= 500 THEN '₹100 - ₹500'
                WHEN ${items.price} <= 2000 THEN '₹500 - ₹2000'
                ELSE 'Over ₹2000'
            END
        `);

    return {
        totalInventoryValue: financialData[0]?.totalValue || 0,
        averageItemPrice: financialData[0]?.avgPrice || 0,
        highestPrice: financialData[0]?.maxPrice || 0,
        lowestPrice: financialData[0]?.minPrice || 0,
        mostExpensive,
        leastExpensive,
        priceDistribution: priceRanges
    };
};

// Performance Analytics Helper
const getPerformanceAnalytics = async () => {
    // Top selling items by quantity
    const topSellingByQuantity = await db
        .select({
            itemId: orderItems.itemId,
            itemName: items.name,
            totalSold: sum(orderItems.quantity),
            currentStock: items.quantity,
            stockStatus: sql`
                CASE 
                    WHEN ${items.quantity} <= ${items.minStockLevel} THEN 'Low Stock'
                    WHEN ${items.quantity} = 0 THEN 'Out of Stock'
                    ELSE 'In Stock'
                END
            `
        })
        .from(orderItems)
        .innerJoin(items, eq(orderItems.itemId, items.id))
        .groupBy(orderItems.itemId, items.name, items.quantity, items.minStockLevel)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(10);

    // Top selling items by revenue
    const topSellingByRevenue = await db
        .select({
            itemId: orderItems.itemId,
            itemName: items.name,
            totalRevenue: sum(orderItems.totalPrice),
            totalQuantitySold: sum(orderItems.quantity)
        })
        .from(orderItems)
        .innerJoin(items, eq(orderItems.itemId, items.id))
        .groupBy(orderItems.itemId, items.name)
        .orderBy(desc(sum(orderItems.totalPrice)))
        .limit(10);

    // Slow moving items (items that haven't sold much)
    const slowMovingItems = await db
        .select({
            id: items.id,
            name: items.name,
            currentStock: items.quantity,
            category: items.category,
            totalSold: sql`COALESCE(sold.total_sold, 0)`,
            daysInInventory: sql`EXTRACT(days FROM NOW() - ${items.createdAt})`
        })
        .from(items)
        .leftJoin(
            sql`(
                SELECT item_id, SUM(quantity) as total_sold 
                FROM order_items 
                GROUP BY item_id
            ) as sold`,
            sql`sold.item_id = ${items.id}`
        )
        .where(eq(items.isActive, 1))
        .orderBy(asc(sql`COALESCE(sold.total_sold, 0)`))
        .limit(10);

    return {
        topSellingByQuantity,
        topSellingByRevenue,
        slowMovingItems
    };
};

// Category Analytics Helper
const getCategoryAnalytics = async () => {
    const categoryStats = await db
        .select({
            category: items.category,
            itemCount: count(),
            totalValue: sum(sql`${items.price} * ${items.quantity}`),
            avgPrice: avg(items.price),
            lowStockCount: sql`COUNT(CASE WHEN ${items.quantity} <= ${items.minStockLevel} THEN 1 END)`,
            outOfStockCount: sql`COUNT(CASE WHEN ${items.quantity} = 0 THEN 1 END)`
        })
        .from(items)
        .where(eq(items.isActive, 1))
        .groupBy(items.category)
        .orderBy(desc(count()));

    // Calculate percentages
    const totalItems = categoryStats.reduce((sum, cat) => sum + cat.itemCount, 0);
    const totalValue = categoryStats.reduce((sum, cat) => sum + parseFloat(cat.totalValue || 0), 0);

    const categoriesWithPercentages = categoryStats.map(cat => ({
        ...cat,
        itemPercentage: totalItems > 0 ? ((cat.itemCount / totalItems) * 100).toFixed(2) : 0,
        valuePercentage: totalValue > 0 ? ((parseFloat(cat.totalValue || 0) / totalValue) * 100).toFixed(2) : 0
    }));

    return {
        categories: categoriesWithPercentages,
        totalCategories: categoryStats.length,
        summary: {
            totalItems,
            totalValue
        }
    };
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
    try {
        const lowStockItemsRaw = await db
            .select()
            .from(items)
            .where(and(
                sql`${items.quantity} <= ${items.minStockLevel}`,
                eq(items.isActive, 1)
            ))
            .orderBy(asc(sql`${items.quantity} - ${items.minStockLevel}`));

        // Process images for response
        const lowStockItems = processItemsImages(lowStockItemsRaw);

        return successResponse(res, 'Low stock alerts retrieved successfully', {
            items: lowStockItems,
            count: lowStockItems.length
        });
    } catch (error) {
        console.error('Error getting low stock alerts:', error);
        return errorResponse(res, 'Failed to retrieve low stock alerts', 500);
    }
};

// Add new item to inventory
export const addItem = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            quantity,
            minStockLevel,
            discount,
            unit,
            category
        } = req.body;

        // Validation
        if (!name || !price || !unit) {
            return errorResponse(res, 'Name, price, and unit are required', 400);
        }

        if (!VALID_UNITS.includes(unit)) {
            return errorResponse(res, `Invalid unit. Valid units are: ${VALID_UNITS.join(', ')}`, 400);
        }

        if (price < 0 || (quantity && quantity < 0)) {
            return errorResponse(res, 'Price and quantity cannot be negative', 400);
        }

        let imageUrl = null;
        let imagePublicId = null;

        // Handle image upload if provided
        if (req.file) {
            try {
                const uploadResult = await uploadImage(req.file.buffer);
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.publicId;
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return errorResponse(res, 'Failed to upload image', 500);
            }
        }

        const newItem = await db.insert(items).values({
            name: name.trim(),
            description: description || null,
            price: parseFloat(price).toFixed(2),
            quantity: parseInt(quantity) || 0,
            minStockLevel: parseInt(minStockLevel) || 10,
            discount: discount ? parseFloat(discount).toFixed(2) : '0.00',
            unit,
            category: category || null,
            image: imageUrl,
            imagePublicId: imagePublicId,
            isActive: 1
        }).returning();

        // Process image for response
        const processedItem = processItemImage(newItem[0]);

        return successResponse(res, 'Item added successfully', processedItem, 201);

    } catch (error) {
        console.error('Error adding item:', error);
        return errorResponse(res, 'Failed to add item', 500);
    }
};

// Edit existing item
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            quantity,
            minStockLevel,
            discount,
            unit,
            category,
            isActive
        } = req.body;

        if (!id) {
            return errorResponse(res, 'Item ID is required', 400);
        }

        // Check if item exists
        const existingItem = await db.select().from(items).where(eq(items.id, parseInt(id)));

        if (existingItem.length === 0) {
            return errorResponse(res, 'Item not found', 404);
        }

        // Validation for provided fields
        if (unit && !VALID_UNITS.includes(unit)) {
            return errorResponse(res, `Invalid unit. Valid units are: ${VALID_UNITS.join(', ')}`, 400);
        }

        if ((price && price < 0) || (quantity && quantity < 0)) {
            return errorResponse(res, 'Price and quantity cannot be negative', 400);
        }

        let imageUrl = existingItem[0].image;
        let imagePublicId = existingItem[0].imagePublicId;

        // Handle image update if provided
        if (req.file) {
            try {
                // Delete old image if exists
                if (existingItem[0].imagePublicId) {
                    await deleteImage(existingItem[0].imagePublicId);
                }

                // Upload new image
                const uploadResult = await uploadImage(req.file.buffer);
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.publicId;
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return errorResponse(res, 'Failed to upload image', 500);
            }
        }

        // Build update object with only provided fields
        const updateData = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price).toFixed(2);
        if (quantity !== undefined) updateData.quantity = parseInt(quantity);
        if (minStockLevel !== undefined) updateData.minStockLevel = parseInt(minStockLevel);
        if (discount !== undefined) updateData.discount = parseFloat(discount).toFixed(2);
        if (unit !== undefined) updateData.unit = unit;
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;

        // Update image fields
        updateData.image = imageUrl;
        updateData.imagePublicId = imagePublicId;

        const updatedItem = await db.update(items)
            .set(updateData)
            .where(eq(items.id, parseInt(id)))
            .returning();

        // Process image for response
        const processedItem = processItemImage(updatedItem[0]);

        return successResponse(res, 'Item updated successfully', processedItem);

    } catch (error) {
        console.error('Error updating item:', error);
        return errorResponse(res, 'Failed to update item', 500);
    }
};

// Delete item (soft delete by setting isActive to 0)
export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query; // ?permanent=true for hard delete

        if (!id) {
            return errorResponse(res, 'Item ID is required', 400);
        }

        // Check if item exists
        const existingItem = await db.select().from(items).where(eq(items.id, parseInt(id)));

        if (existingItem.length === 0) {
            return errorResponse(res, 'Item not found', 404);
        }

        if (permanent === 'true') {
            // Delete image from Cloudinary if exists
            if (existingItem[0].imagePublicId) {
                try {
                    await deleteImage(existingItem[0].imagePublicId);
                } catch (imageDeleteError) {
                    console.error('Failed to delete image from Cloudinary:', imageDeleteError);
                    // Continue with deletion even if image deletion fails
                }
            }

            // Hard delete
            await db.delete(items).where(eq(items.id, parseInt(id)));

            return successResponse(res, 'Item permanently deleted', null);
        } else {
            // Soft delete
            const updatedItem = await db.update(items)
                .set({
                    isActive: 0,
                    updatedAt: new Date()
                })
                .where(eq(items.id, parseInt(id)))
                .returning();

            // Process image for response
            const processedItem = processItemImage(updatedItem[0]);

            return successResponse(res, 'Item deactivated successfully', processedItem);
        }

    } catch (error) {
        console.error('Error deleting item:', error);
        return errorResponse(res, 'Failed to delete item', 500);
    }
};

// Get item by ID
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return errorResponse(res, 'Item ID is required', 400);
        }

        const item = await db
            .select()
            .from(items)
            .where(eq(items.id, parseInt(id)))
            .limit(1);

        if (item.length === 0) {
            return errorResponse(res, 'Item not found', 404);
        }

        // Process image for admin response
        const processedItem = processItemImage(item[0]);

        return successResponse(res, 'Item retrieved successfully', processedItem);
    } catch (error) {
        console.error('Error getting item:', error);
        return errorResponse(res, 'Failed to retrieve item', 500);
    }
};