import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import { requireSuperAdmin, requireAnyAdmin } from '../middlewares/roleMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Protect all admin routes with authentication
router.use(auth);
router.use(requireAnyAdmin);

// Admin management (SuperAdmin only)
router.post('/add', requireSuperAdmin, adminController.addAdmin);
router.delete('/:id', requireSuperAdmin, adminController.removeAdmin);
router.get('/', adminController.getAllAdmins);

// User management (Any Admin)
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', requireSuperAdmin, adminController.deleteUser);

// Analytics endpoints (Any Admin)
router.get('/analytics/orders', adminController.orderAnalytics);
router.get('/analytics/inventory', adminController.inventoryAnalytics);
router.get('/analytics/users', adminController.userAnalytics);
router.get('/analytics/payments', adminController.paymentAnalytics);
router.get('/analytics/dashboard', adminController.getDashboard);

export default router;