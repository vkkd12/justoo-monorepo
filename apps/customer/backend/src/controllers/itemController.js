import db from '../config/dbConfig.js';
import { items, customers } from '@justoo/db';
import { eq, and, or, sql, desc, asc, like, gte, lte, inArray } from 'drizzle-orm';
import { successResponse, errorResponse, getPaginationData } from '../utils/response.js';
import { processItemsImages, processItemImage } from '../config/cloudinary.js';

// Get all items with pagination, filtering, and sorting
export const getItems = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            search,
            minPrice,
            maxPrice,
            sortBy = 'name',
            sortOrder = 'asc',
            inStock = true
        } = req.query;

        const offset = (page - 1) * limit;
        let query = db.select().from(items);
        let conditions = [];

        // Apply filters
        if (category) {
            conditions.push(eq(items.category, category));
        }

        if (search) {
            conditions.push(
                or(
                    like(items.name, `%${search}%`),
                    like(items.description, `%${search}%`)
                )
            );
        }

        if (minPrice !== undefined) {
            conditions.push(gte(items.price, minPrice));
        }

        if (maxPrice !== undefined) {
            conditions.push(lte(items.price, maxPrice));
        }

        if (inStock === 'true') {
            conditions.push(sql`${items.quantity} > 0`);
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Apply sorting
        const validSortFields = ['name', 'price', 'createdAt', 'quantity'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder === 'desc' ? desc : asc;
        query = query.orderBy(order(items[sortField]));

        // Apply pagination
        const itemsList = await query.limit(parseInt(limit)).offset(offset);

        // Get total count for pagination
        let countQuery = db.select({ count: sql`count(*)` }).from(items);
        if (conditions.length > 0) {
            countQuery = countQuery.where(and(...conditions));
        }
        const totalResult = await countQuery;
        const totalItems = parseInt(totalResult[0].count);

        const pagination = getPaginationData(page, limit, totalItems);

        // Process images for customer-facing response
        const processedItems = processItemsImages(itemsList);

        return successResponse(res, 'Items retrieved successfully', {
            items: processedItems,
            pagination
        });
    } catch (error) {
        console.error('Get items error:', error);
        return errorResponse(res, 'Failed to retrieve items', 500);
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

        // Process image for customer-facing response
        const processedItem = processItemImage(item[0]);

        return successResponse(res, 'Item retrieved successfully', processedItem);
    } catch (error) {
        console.error('Get item by ID error:', error);
        return errorResponse(res, 'Failed to retrieve item', 500);
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await db
            .select({
                category: items.category,
                count: sql`count(*)`,
                totalItems: sql`sum(${items.quantity})`
            })
            .from(items)
            .where(and(
                sql`${items.category} IS NOT NULL`,
                sql`${items.isActive} = 1`
            ))
            .groupBy(items.category)
            .orderBy(asc(items.category));

        return successResponse(res, 'Categories retrieved successfully', categories);
    } catch (error) {
        console.error('Get categories error:', error);
        return errorResponse(res, 'Failed to retrieve categories', 500);
    }
};

// Get featured/popular items
export const getFeaturedItems = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const featuredItems = await db
            .select()
            .from(items)
            .where(and(
                sql`${items.quantity} > 0`,
                sql`${items.isActive} = 1`,
                sql`${items.discount} > 0` // Items with discount are considered featured
            ))
            .orderBy(desc(items.discount))
            .limit(parseInt(limit));

        // Process images for customer-facing response
        const processedItems = processItemsImages(featuredItems);

        return successResponse(res, 'Featured items retrieved successfully', processedItems);
    } catch (error) {
        console.error('Get featured items error:', error);
        return errorResponse(res, 'Failed to retrieve featured items', 500);
    }
};

// Search items
export const searchItems = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return errorResponse(res, 'Search query must be at least 2 characters long', 400);
        }

        const searchResults = await db
            .select()
            .from(items)
            .where(and(
                sql`${items.isActive} = 1`,
                or(
                    like(items.name, `%${q}%`),
                    like(items.description, `%${q}%`),
                    like(items.category, `%${q}%`)
                )
            ))
            .orderBy(desc(sql`CASE
        WHEN ${items.name} ILIKE ${`%${q}%`} THEN 3
        WHEN ${items.category} ILIKE ${`%${q}%`} THEN 2
        WHEN ${items.description} ILIKE ${`%${q}%`} THEN 1
        ELSE 0
      END`))
            .limit(parseInt(limit));

        // Process images for customer-facing response
        const processedResults = processItemsImages(searchResults);

        return successResponse(res, 'Search results retrieved successfully', {
            query: q,
            results: processedResults,
            total: processedResults.length
        });
    } catch (error) {
        console.error('Search items error:', error);
        return errorResponse(res, 'Failed to search items', 500);
    }
};

// Get items by category
export const getItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query;

        if (!category) {
            return errorResponse(res, 'Category is required', 400);
        }

        const offset = (page - 1) * limit;
        let query = db
            .select()
            .from(items)
            .where(and(
                eq(items.category, category),
                sql`${items.isActive} = 1`
            ));

        // Apply sorting
        const validSortFields = ['name', 'price', 'createdAt', 'quantity'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder === 'desc' ? desc : asc;
        query = query.orderBy(order(items[sortField]));

        const categoryItems = await query.limit(parseInt(limit)).offset(offset);

        // Get total count
        const totalResult = await db
            .select({ count: sql`count(*)` })
            .from(items)
            .where(and(
                eq(items.category, category),
                sql`${items.isActive} = 1`
            ));

        const totalItems = parseInt(totalResult[0].count);
        const pagination = getPaginationData(page, limit, totalItems);

        // Process images for customer-facing response
        const processedItems = processItemsImages(categoryItems);

        return successResponse(res, `Items in category '${category}' retrieved successfully`, {
            category,
            items: processedItems,
            pagination
        });
    } catch (error) {
        console.error('Get items by category error:', error);
        return errorResponse(res, 'Failed to retrieve items by category', 500);
    }
};

// Get item suggestions based on customer preferences
export const getItemSuggestions = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const customerId = req.customer?.id;

        if (!customerId) {
            // Return popular items for non-authenticated users
            return getFeaturedItems(req, res);
        }

        // Get customer's order history to suggest similar items
        const customerOrders = await db
            .select({
                itemId: sql`oi.item_id`,
                itemName: sql`oi.item_name`,
                category: sql`i.category`
            })
            .from(sql`order_items oi`)
            .join(sql`orders o`, eq(sql`oi.order_id`, sql`o.id`))
            .join(sql`items i`, eq(sql`oi.item_id`, sql`i.id`))
            .where(eq(sql`o.customer_id`, customerId))
            .orderBy(desc(sql`o.created_at`))
            .limit(50);

        if (customerOrders.length === 0) {
            // No order history, return featured items
            return getFeaturedItems(req, res);
        }

        // Get categories from customer's previous orders
        const categories = [...new Set(customerOrders.map(order => order.category).filter(Boolean))];

        // Suggest items from same categories
        let suggestions = [];
        if (categories.length > 0) {
            suggestions = await db
                .select()
                .from(items)
                .where(and(
                    sql`${items.isActive} = 1`,
                    sql`${items.quantity} > 0`,
                    inArray(items.category, categories)
                ))
                .orderBy(desc(items.createdAt))
                .limit(parseInt(limit));
        }

        // Process images for customer-facing response
        const processedSuggestions = processItemsImages(suggestions);

        return successResponse(res, 'Item suggestions retrieved successfully', {
            suggestions: processedSuggestions,
            basedOn: categories.length > 0 ? 'previous orders' : 'featured items'
        });
    } catch (error) {
        console.error('Get item suggestions error:', error);
        return errorResponse(res, 'Failed to retrieve item suggestions', 500);
    }
};