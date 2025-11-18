import 'dotenv/config';
import app from './app.js';

const PORT = process.env.BACKEND_PORT || process.env.PORT || 8080;

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Customer Backend Server running on port ${PORT}`);
    console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});