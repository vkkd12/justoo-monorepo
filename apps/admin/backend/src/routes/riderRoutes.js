import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import { requireAnyAdmin } from '../middlewares/roleMiddleware.js';
import * as riderController from '../controllers/riderController.js';

const router = express.Router();

// Protect all rider routes with authentication and admin access
router.use(auth);
router.use(requireAnyAdmin); 

// Rider management endpoints (admin only)
router.get('/', riderController.getAllRiders);
router.get('/analytics', riderController.getRiderAnalytics);
router.get('/:id', riderController.getRiderById);
router.post('/', riderController.addRider);
router.put('/:id', riderController.updateRider);
router.put('/:id/password', riderController.changeRiderPassword);
router.delete('/:id', riderController.removeRider);

// Legacy endpoints for backwards compatibility
router.get('/all', riderController.getAllRiders);
router.post('/add', riderController.addRider);
router.delete('/remove/:id', riderController.removeRider);

export default router;
