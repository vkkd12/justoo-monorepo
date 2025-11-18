import express from 'express';
import {
    processOrderPlacement,
    processOrderCancellation,
    bulkUpdateQuantities,
    checkStockAvailability,
    getAllOrders,
    getOrderById,
    getOrderByExternalId
} from '../controllers/orderController.js';

const router = express.Router();

// Order viewing routes - no authentication required (external backend access)
router.get('/', getAllOrders);                     // GET /api/orders - list orders
router.get('/external/:externalId', getOrderByExternalId);  // GET /api/orders/external/:externalId - get order by external ID
router.get('/:id', getOrderById);                  // GET /api/orders/:id - get specific order

// Order processing routes - no authentication required (external backend access)
router.post('/place-order', processOrderPlacement);           // POST /api/orders/place-order
router.post('/cancel-order', processOrderCancellation);       // POST /api/orders/cancel-order

// Stock management routes - no authentication required (external backend access)
router.post('/bulk-update', bulkUpdateQuantities);            // POST /api/orders/bulk-update

// Stock availability check - no authentication required (external backend access)
router.post('/check-availability', checkStockAvailability);   // POST /api/orders/check-availability

export default router;
