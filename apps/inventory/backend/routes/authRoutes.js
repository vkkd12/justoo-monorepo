import express from 'express';
import {
    login,
    logout,
    getProfile
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);                      // POST /api/auth/login
router.post('/logout', logout);                    // POST /api/auth/logout

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);             // GET /api/auth/profile

export default router;
