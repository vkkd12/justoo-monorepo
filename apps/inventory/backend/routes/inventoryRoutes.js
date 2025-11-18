import express from 'express';
import {
    addItem,
    editItem,
    deleteItem,
    listInStockItems,
    listOutOfStockItems,
    listLowStockItems,
    getAllItems,
    getItemById,
    upload,
    VALID_UNITS
} from '../controllers/inventoryController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/units', (req, res) => {               // GET /api/inventory/units
    res.json({
        success: true,
        data: VALID_UNITS
    });
});

// Protected routes (require authentication)
// Read operations - all authenticated users can access
router.get('/items', authenticateToken, getAllItems);                 // GET /api/inventory/items
router.get('/items/:id', authenticateToken, getItemById);             // GET /api/inventory/items/:id
router.get('/stock/in-stock', authenticateToken, listInStockItems);     // GET /api/inventory/stock/in-stock
router.get('/stock/out-of-stock', authenticateToken, listOutOfStockItems); // GET /api/inventory/stock/out-of-stock
router.get('/stock/low-stock', authenticateToken, listLowStockItems);   // GET /api/inventory/stock/low-stock

// Write operations - require admin role only
router.post('/items', authenticateToken, authorizeRoles('admin'), upload.single('image'), addItem);                    // POST /api/inventory/items
router.put('/items/:id', authenticateToken, authorizeRoles('admin'), upload.single('image'), editItem);                // PUT /api/inventory/items/:id
router.delete('/items/:id', authenticateToken, authorizeRoles('admin'), deleteItem);           // DELETE /api/inventory/items/:id

// Get dashboard statistics - require authentication
router.get('/dashboard/stats', authenticateToken, getDashboardStats);

export default router;
