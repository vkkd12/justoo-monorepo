import './config/env.js'; // Load environment variables first
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import adminRoutes from './routes/adminRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import inventoryAdminRoutes from './routes/inventoryAdminRoutes.js';
import riderRoutes from './routes/riderRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3003',
    credentials: true
}));

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/inventory-admins', inventoryAdminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/orders', orderRoutes);

// Error handler middleware
app.use(errorHandler);

export default app;
