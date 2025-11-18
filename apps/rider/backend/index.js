import app from './app.js';
import { checkDatabaseConnection } from './db/index.js';

const PORT = process.env.BACKEND_PORT || process.env.PORT || process.env.RIDER_BACKEND_PORT || 3006;

app.listen(PORT, () => {
    try {
        const dbConnected = checkDatabaseConnection();

        const dbStatus = dbConnected ? "connected" : "disconnected";
        if (dbConnected) {
            console.log("✅ Database connected successfully");
        }

        console.log(`Database status: ${dbStatus}`);
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    } catch (err) {
        console.error("Error checking database connection:", err);
    }
});
