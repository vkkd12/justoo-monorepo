import express from "express";
import cors from "cors";
import { checkDatabaseConnection } from "./db/index.js";
import authRoutes from "./routes/authRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import riderRoutes from "./routes/riderRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import deliveryRoutes from "./routes/deliveryRoute.js";

const app = express();
const PORT = process.env.RIDER_BACKEND_PORT || 3006;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/delivery", deliveryRoutes);

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
