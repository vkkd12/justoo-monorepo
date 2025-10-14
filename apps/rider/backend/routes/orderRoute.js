import express from "express";
import {
    getCurrentOrderForRider,
    getAssignedOrdersForRider,
    getCompletedOrdersForRider,
    updateOrderStatus,
    acceptOrder,
    getOrderDetails,
    getAvailableOrders,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get available orders for riders to accept
router.get("/available", authMiddleware, getAvailableOrders);

// Get the current order assigned to the rider
router.get("/current", authMiddleware, getCurrentOrderForRider);

// Get all orders assigned to the rider (with pagination and status filter)
router.get("/assigned", authMiddleware, getAssignedOrdersForRider);

// Get all completed orders for the rider (with pagination)
router.get("/completed", authMiddleware, getCompletedOrdersForRider);

// Get order details by ID
router.get("/:orderId", authMiddleware, getOrderDetails);

// Accept order assignment
router.post("/:orderId/accept", authMiddleware, acceptOrder);

// Update order status
router.put("/:orderId/status", authMiddleware, updateOrderStatus);

export default router;
