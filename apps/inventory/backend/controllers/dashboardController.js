import { db } from '../db/index.js';
import { items as itemTable } from '@justoo/db';
import { eq, sql, and } from 'drizzle-orm';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalItems,
            inStockItems,
            outOfStockItems,
            lowStockItems,
            totalValue
        ] = await Promise.all([
            // Total active items
            db.select({ count: sql`count(*)` }).from(itemTable)
                .where(eq(itemTable.isActive, 1)),

            // In stock items
            db.select({ count: sql`count(*)` }).from(itemTable)
                .where(and(
                    eq(itemTable.isActive, 1),
                    sql`${itemTable.quantity} > 0`
                )),

            // Out of stock items
            db.select({ count: sql`count(*)` }).from(itemTable)
                .where(and(
                    eq(itemTable.isActive, 1),
                    eq(itemTable.quantity, 0)
                )),

            // Low stock items
            db.select({ count: sql`count(*)` }).from(itemTable)
                .where(and(
                    eq(itemTable.isActive, 1),
                    sql`${itemTable.quantity} <= ${itemTable.minStockLevel}`,
                    sql`${itemTable.quantity} > 0`
                )),

            // Total inventory value
            db.select({
                value: sql`SUM(CAST(${itemTable.price} AS DECIMAL) * ${itemTable.quantity})`
            }).from(itemTable)
                .where(eq(itemTable.isActive, 1))
        ]);

        res.json({
            success: true,
            data: {
                totalItems: parseInt(totalItems[0].count),
                inStockItems: parseInt(inStockItems[0].count),
                outOfStockItems: parseInt(outOfStockItems[0].count),
                lowStockItems: parseInt(lowStockItems[0].count),
                totalInventoryValue: parseFloat(totalValue[0].value || 0).toFixed(2)
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};