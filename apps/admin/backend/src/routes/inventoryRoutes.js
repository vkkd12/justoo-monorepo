import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import { requireAnyAdmin } from '../middlewares/roleMiddleware.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

// Protect all inventory routes with authentication and admin access
router.use(auth);
router.use(requireAnyAdmin); // Only admin roles can view inventory

// Inventory management endpoints
router.get('/', inventoryController.getAllItems);
router.get('/analytics', inventoryController.getInventoryAnalytics);
router.get('/low-stock', inventoryController.getLowStockAlerts);
router.get('/:id', inventoryController.getItemById);

export default router;
