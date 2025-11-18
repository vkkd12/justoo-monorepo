import express from 'express';
import * as addressController from '../controllers/addressController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All address routes require authentication
router.use(authenticate);

router.get('/', addressController.getCustomerAddresses);
router.get('/default', addressController.getDefaultAddress);
router.get('/validate', addressController.validateAddress);
router.get('/:addressId', addressController.getAddressById);
router.post('/', addressController.addAddress);
router.put('/:addressId', addressController.updateAddress);
router.put('/:addressId/default', addressController.setDefaultAddress);
router.delete('/:addressId', addressController.deleteAddress);

export default router;