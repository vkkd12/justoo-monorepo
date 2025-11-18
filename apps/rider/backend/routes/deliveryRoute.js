import express from "express";
import {
    startDelivery,
    completeDelivery,
    failDelivery,
    getDeliveryHistory,
    getDeliveryStats,
    updateDeliveryProgress,
} from "../controllers/deliveryController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Start delivery for an order
router.post("/:orderId/start", authMiddleware, startDelivery);

// Complete delivery
router.post("/:orderId/complete", authMiddleware, completeDelivery);

// Mark delivery as failed
router.post("/:orderId/fail", authMiddleware, failDelivery);

// Update delivery progress/location
router.put("/:orderId/progress", authMiddleware, updateDeliveryProgress);

// Get delivery history for rider
router.get("/history", authMiddleware, getDeliveryHistory);

// Get delivery statistics for rider
router.get("/stats", authMiddleware, getDeliveryStats);

export default router;