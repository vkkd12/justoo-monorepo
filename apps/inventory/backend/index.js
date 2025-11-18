import app from './app.js';

const PORT = process.env.BACKEND_PORT || process.env.PORT || process.env.INVENTORY_BACKEND_PORT || 3001;

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Inventory API server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`� Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`�📦 Inventory API: http://localhost:${PORT}/api/inventory`);
    console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`);
    console.log(`👤 Default admin: username=admin, password=admin123`);
});



