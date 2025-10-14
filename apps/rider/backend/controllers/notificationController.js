import { db } from "../db/index.js";
import { riderNotifications } from "../../../../packages/db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

// Get notifications for the rider
export const getNotifications = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const offset = (page - 1) * limit;

        let query = db
            .select()
            .from(riderNotifications)
            .where(eq(riderNotifications.riderId, riderId));

        // Filter for unread notifications if requested
        if (unreadOnly === 'true') {
            query = query.where(eq(riderNotifications.isRead, 0));
        }

        // Order by creation date (newest first)
        query = query.orderBy(desc(riderNotifications.sentAt));

        // Apply pagination
        const notifications = await query.limit(parseInt(limit)).offset(offset);

        // Get total count for pagination
        let countQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(riderNotifications)
            .where(eq(riderNotifications.riderId, riderId));

        if (unreadOnly === 'true') {
            countQuery = countQuery.where(eq(riderNotifications.isRead, 0));
        }

        const totalResult = await countQuery;
        const totalNotifications = parseInt(totalResult[0].count);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalNotifications / limit),
                    totalItems: totalNotifications,
                    itemsPerPage: parseInt(limit),
                    hasNext: page * limit < totalNotifications,
                    hasPrev: page > 1,
                },
            },
        });
    } catch (error) {
        console.error("Error getting notifications:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { notificationId } = req.params;

        // Update notification as read
        const updatedNotification = await db
            .update(riderNotifications)
            .set({
                isRead: 1,
                readAt: new Date(),
            })
            .where(
                and(
                    eq(riderNotifications.id, parseInt(notificationId)),
                    eq(riderNotifications.riderId, riderId)
                )
            )
            .returning();

        if (updatedNotification.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: updatedNotification[0],
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const riderId = req.user.userId;

        // Update all unread notifications as read
        await db
            .update(riderNotifications)
            .set({
                isRead: 1,
                readAt: new Date(),
            })
            .where(
                and(
                    eq(riderNotifications.riderId, riderId),
                    eq(riderNotifications.isRead, 0)
                )
            );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get notification count (unread)
export const getNotificationCount = async (req, res) => {
    try {
        const riderId = req.user.userId;

        // Get count of unread notifications
        const unreadCount = await db
            .select({ count: sql`COUNT(*)` })
            .from(riderNotifications)
            .where(
                and(
                    eq(riderNotifications.riderId, riderId),
                    eq(riderNotifications.isRead, 0)
                )
            );

        // Get total count
        const totalCount = await db
            .select({ count: sql`COUNT(*)` })
            .from(riderNotifications)
            .where(eq(riderNotifications.riderId, riderId));

        res.status(200).json({
            success: true,
            data: {
                unread: parseInt(unreadCount[0].count),
                total: parseInt(totalCount[0].count),
            },
        });
    } catch (error) {
        console.error("Error getting notification count:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Create a notification for the rider (internal function)
export const createNotification = async (riderId, type, title, message, data = null) => {
    try {
        const notification = await db
            .insert(riderNotifications)
            .values({
                riderId: riderId,
                type,
                title,
                message,
                data: data ? JSON.stringify(data) : null,
                isRead: 0,
                sentAt: new Date(),
            })
            .returning();

        return notification[0];
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { notificationId } = req.params;

        // Delete notification
        const deletedNotification = await db
            .delete(riderNotifications)
            .where(
                and(
                    eq(riderNotifications.id, parseInt(notificationId)),
                    eq(riderNotifications.riderId, riderId)
                )
            )
            .returning();

        if (deletedNotification.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};