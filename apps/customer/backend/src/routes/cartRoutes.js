import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', cartController.getCart);
router.get('/summary', cartController.getCartSummary);
router.post('/add', cartController.addToCart);
router.put('/item/:itemId', cartController.updateCartItem);
router.delete('/item/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;