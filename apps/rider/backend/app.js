import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import riderRoutes from "./routes/riderRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import deliveryRoutes from "./routes/deliveryRoute.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/delivery", deliveryRoutes);

export default app;