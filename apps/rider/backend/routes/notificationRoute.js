import express from "express";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotificationCount,
    deleteNotification
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get notifications
router.get("/", authMiddleware, getNotifications);

// Get notification count
router.get("/count", authMiddleware, getNotificationCount);

// Mark notification as read
router.put("/:notificationId/read", authMiddleware, markNotificationAsRead);

// Mark all notifications as read
router.put("/read-all", authMiddleware, markAllNotificationsAsRead);

// Delete notification
router.delete("/:notificationId", authMiddleware, deleteNotification);

export default router;