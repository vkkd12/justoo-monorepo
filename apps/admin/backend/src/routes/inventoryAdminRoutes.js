// Inventory Admin Routes - For admin system to manage inventory users
import { Router } from 'express';
import inventoryAdminController from '../controllers/inventoryAdminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { requireSuperAdmin } from '../middlewares/roleMiddleware.js';

const router = Router();

// All routes require authentication and superadmin role
router.use(authMiddleware);
router.use(requireSuperAdmin);

// Get all inventory admins
router.get('/', inventoryAdminController.getInventoryAdmins);

// Get single inventory admin
router.get('/:id', inventoryAdminController.getInventoryAdmin);

// Create new inventory admin
router.post('/', inventoryAdminController.createInventoryAdmin);

// Update inventory admin
router.put('/:id', inventoryAdminController.updateInventoryAdmin);

// Delete inventory admin
router.delete('/:id', inventoryAdminController.deleteInventoryAdmin);

// Toggle inventory admin status
router.patch('/:id/toggle-status', inventoryAdminController.toggleInventoryAdminStatus);

export default router;
