import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import backend apps
import adminApp from './apps/admin/backend/src/app.js';
import customerApp from './apps/customer/backend/src/app.js';
import inventoryApp from './apps/inventory/backend/app.js';
import riderApp from './apps/rider/backend/app.js';

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;

// CORS configuration - allow credentials with specific origins
app.use(cors({
    origin: [
        'http://localhost:3001', // Customer frontend
        'http://localhost:3002', // Rider frontend
        'http://localhost:3003', // Admin frontend
        'http://localhost:3004', // Inventory frontend
        process.env.ADMIN_FRONTEND_URL,
        process.env.CUSTOMER_FRONTEND_URL,
        process.env.INVENTORY_FRONTEND_URL,
        process.env.RIDER_FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Mount sub-apps
app.use('/admin', adminApp);
app.use('/customer', customerApp);
app.use('/inventory', inventoryApp);
app.use('/rider', riderApp);

// Root health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Gateway is running',
        services: ['admin', 'customer', 'inventory', 'rider'],
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Gateway Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Admin API: http://localhost:${PORT}/admin/api/*`);
    console.log(`🛒 Customer API: http://localhost:${PORT}/customer/api/*`);
    console.log(`📦 Inventory API: http://localhost:${PORT}/inventory/api/*`);
    console.log(`🏍️ Rider API: http://localhost:${PORT}/rider/api/*`);
});