import { db } from '../db/index.js';
import { items as itemTable } from '@justoo/db';
import { eq, sql, and } from 'drizzle-orm';
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
            return res.status(400).json({
                success: false,
                message: 'Name, price, and unit are required fields'
            });
        }

        if (!VALID_UNITS.includes(unit)) {
            return res.status(400).json({
                success: false,
                message: `Invalid unit. Valid units are: ${VALID_UNITS.join(', ')}`
            });
        }

        if (price < 0 || (quantity && quantity < 0)) {
            return res.status(400).json({
                success: false,
                message: 'Price and quantity cannot be negative'
            });
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
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload image',
                    error: uploadError.message
                });
            }
        }

        const newItem = await db.insert(itemTable).values({
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
            updatedAt: new Date()
        }).returning();

        res.status(201).json({
            success: true,
            message: 'Item added successfully',
            data: processItemImage(newItem[0])
        });

    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Edit existing item
export const editItem = async (req, res) => {
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
            return res.status(400).json({
                success: false,
                message: 'Item ID is required'
            });
        }

        // Check if item exists
        const existingItem = await db.select().from(itemTable).where(eq(itemTable.id, parseInt(id)));

        if (existingItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Validation for provided fields
        if (unit && !VALID_UNITS.includes(unit)) {
            return res.status(400).json({
                success: false,
                message: `Invalid unit. Valid units are: ${VALID_UNITS.join(', ')}`
            });
        }

        if ((price && price < 0) || (quantity && quantity < 0)) {
            return res.status(400).json({
                success: false,
                message: 'Price and quantity cannot be negative'
            });
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
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload image',
                    error: uploadError.message
                });
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

        const updatedItem = await db.update(itemTable)
            .set(updateData)
            .where(eq(itemTable.id, parseInt(id)))
            .returning();

        res.status(200).json({
            success: true,
            message: 'Item updated successfully',
            data: processItemImage(updatedItem[0])
        });

    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete item (soft delete by setting isActive to 0)
export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query; // ?permanent=true for hard delete

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Item ID is required'
            });
        }

        // Check if item exists
        const existingItem = await db.select().from(itemTable).where(eq(itemTable.id, parseInt(id)));

        if (existingItem.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
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
            await db.delete(itemTable).where(eq(itemTable.id, parseInt(id)));

            res.status(200).json({
                success: true,
                message: 'Item permanently deleted'
            });
        } else {
            // Soft delete
            const updatedItem = await db.update(itemTable)
                .set({
                    isActive: 0,
                    updatedAt: new Date()
                })
                .where(eq(itemTable.id, parseInt(id)))
                .returning();

            res.status(200).json({
                success: true,
                message: 'Item deactivated successfully',
                data: processItemImage(updatedItem[0])
            });
        }

    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// List all in-stock items (quantity > 0)
export const listInStockItems = async (req, res) => {
    try {
        const { category, page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = and(
            eq(itemTable.isActive, 1),
            sql`${itemTable.quantity} > 0`
        );

        // Add category filter if provided
        if (category) {
            whereConditions = and(whereConditions, eq(itemTable.category, category));
        }

        // Add search filter if provided
        if (search) {
            whereConditions = and(
                whereConditions,
                sql`LOWER(${itemTable.name}) LIKE LOWER(${'%' + search + '%'})`
            );
        }

        const items = await db.select().from(itemTable)
            .where(whereConditions)
            .limit(parseInt(limit))
            .offset(offset)
            .orderBy(itemTable.name);

        // Get total count for pagination
        const totalCount = await db.select({ count: sql`count(*)` }).from(itemTable)
            .where(whereConditions);

        res.status(200).json({
            success: true,
            data: processItemsImages(items),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount[0].count),
                totalPages: Math.ceil(parseInt(totalCount[0].count) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching in-stock items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// List all out-of-stock items (quantity = 0)
export const listOutOfStockItems = async (req, res) => {
    try {
        const { category, page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = and(
            eq(itemTable.isActive, 1),
            eq(itemTable.quantity, 0)
        );

        // Add category filter if provided
        if (category) {
            whereConditions = and(whereConditions, eq(itemTable.category, category));
        }

        // Add search filter if provided
        if (search) {
            whereConditions = and(
                whereConditions,
                sql`LOWER(${itemTable.name}) LIKE LOWER(${'%' + search + '%'})`
            );
        }

        const items = await db.select().from(itemTable)
            .where(whereConditions)
            .limit(parseInt(limit))
            .offset(offset)
            .orderBy(itemTable.name);

        // Get total count for pagination
        const totalCount = await db.select({ count: sql`count(*)` }).from(itemTable)
            .where(whereConditions);

        res.status(200).json({
            success: true,
            data: processItemsImages(items),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount[0].count),
                totalPages: Math.ceil(parseInt(totalCount[0].count) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching out-of-stock items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// List items with low stock (quantity <= minStockLevel and > 0)
export const listLowStockItems = async (req, res) => {
    try {
        const { category, page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = and(
            eq(itemTable.isActive, 1),
            sql`${itemTable.quantity} <= ${itemTable.minStockLevel}`,
            sql`${itemTable.quantity} > 0`
        );

        // Add category filter if provided
        if (category) {
            whereConditions = and(whereConditions, eq(itemTable.category, category));
        }

        // Add search filter if provided
        if (search) {
            whereConditions = and(
                whereConditions,
                sql`LOWER(${itemTable.name}) LIKE LOWER(${'%' + search + '%'})`
            );
        }

        const items = await db.select().from(itemTable)
            .where(whereConditions)
            .limit(parseInt(limit))
            .offset(offset)
            .orderBy(itemTable.quantity); // Order by quantity to show lowest first

        // Get total count for pagination
        const totalCount = await db.select({ count: sql`count(*)` }).from(itemTable)
            .where(whereConditions);

        res.status(200).json({
            success: true,
            data: processItemsImages(items),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount[0].count),
                totalPages: Math.ceil(parseInt(totalCount[0].count) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all items with various filters
export const getAllItems = async (req, res) => {
    try {
        const {
            category,
            page = 1,
            limit = 20,
            search,
            stockStatus, // 'in-stock', 'out-of-stock', 'low-stock', 'all'
            includeInactive = false
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];

        // Include inactive items only if requested
        if (!includeInactive || includeInactive === 'false') {
            whereConditions.push(eq(itemTable.isActive, 1));
        }

        // Add stock status filter
        if (stockStatus) {
            switch (stockStatus) {
                case 'in-stock':
                    whereConditions.push(sql`${itemTable.quantity} > 0`);
                    break;
                case 'out-of-stock':
                    whereConditions.push(eq(itemTable.quantity, 0));
                    break;
                case 'low-stock':
                    whereConditions.push(
                        sql`${itemTable.quantity} <= ${itemTable.minStockLevel}`,
                        sql`${itemTable.quantity} > 0`
                    );
                    break;
                // 'all' or any other value will not add stock filter
            }
        }

        // Add category filter if provided
        if (category) {
            whereConditions.push(eq(itemTable.category, category));
        }

        // Add search filter if provided
        if (search) {
            whereConditions.push(
                sql`LOWER(${itemTable.name}) LIKE LOWER(${`%${search}%`})`
            );
        }

        const finalWhereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        const items = await db.select().from(itemTable)
            .where(finalWhereCondition)
            .limit(parseInt(limit))
            .offset(offset)
            .orderBy(itemTable.name);

        // Get total count for pagination
        const totalCount = await db.select({ count: sql`count(*)` }).from(itemTable)
            .where(finalWhereCondition);

        res.status(200).json({
            success: true,
            data: processItemsImages(items),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(totalCount[0].count),
                totalPages: Math.ceil(parseInt(totalCount[0].count) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get single item by ID
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Item ID is required'
            });
        }

        const item = await db.select().from(itemTable).where(eq(itemTable.id, parseInt(id)));

        if (item.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: processItemImage(item[0])
        });

    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
