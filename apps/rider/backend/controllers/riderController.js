import { db } from "../db/index.js";
import { justooRiders as ridersTable, orders, customerAddresses } from "../../../../packages/db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Update rider profile
export const updateProfile = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { name, phone, email, vehicleType, vehicleNumber, licenseNumber } = req.body;

        // Build update object with only provided fields
        const updateData = {
            updatedAt: new Date(),
        };

        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
        if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;

        // Update rider profile
        const updatedRider = await db
            .update(ridersTable)
            .set(updateData)
            .where(eq(ridersTable.id, riderId))
            .returning();

        if (updatedRider.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rider not found",
            });
        }

        // Return updated profile without password
        const { password, ...riderWithoutPassword } = updatedRider[0];

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: riderWithoutPassword,
        });
    } catch (error) {
        console.error("Error updating rider profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update rider password
export const updatePassword = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long",
            });
        }

        // Get current rider
        const rider = await db
            .select()
            .from(ridersTable)
            .where(eq(ridersTable.id, riderId));

        if (rider.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rider not found",
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            rider[0].password
        );

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await db
            .update(ridersTable)
            .set({
                password: hashedNewPassword,
                updatedAt: new Date(),
            })
            .where(eq(ridersTable.id, riderId));

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error updating rider password:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update rider status (active, busy, inactive)
export const updateStatus = async (req, res) => {
    try {
        const riderId = req.user.userId;
        const { status } = req.body;

        // Validation
        const validStatuses = ['active', 'busy', 'inactive'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: active, busy, inactive",
            });
        }

        // Update rider status
        const updatedRider = await db
            .update(ridersTable)
            .set({
                status: status,
                updatedAt: new Date(),
            })
            .where(eq(ridersTable.id, riderId))
            .returning();

        if (updatedRider.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Rider not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            data: {
                status: updatedRider[0].status,
            },
        });
    } catch (error) {
        console.error("Error updating rider status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get rider statistics
export const getRiderStats = async (req, res) => {
    try {
        const riderId = req.user.userId;

        // Get rider's order statistics
        const stats = await db
            .select({
                totalDeliveries: sql`COUNT(*)`,
                completedDeliveries: sql`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
                totalEarnings: sql`SUM(${orders.totalAmount})`,
                averageRating: ridersTable.rating,
            })
            .from(orders)
            .rightJoin(ridersTable, eq(orders.riderId, ridersTable.id))
            .where(eq(orders.riderId, riderId))
            .groupBy(ridersTable.id, ridersTable.rating);

        // Get today's deliveries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayDeliveries = await db
            .select({ count: sql`COUNT(*)` })
            .from(orders)
            .where(
                and(
                    eq(orders.riderId, riderId),
                    eq(orders.status, 'delivered'),
                    sql`${orders.deliveredAt} >= ${today}`,
                    sql`${orders.deliveredAt} < ${tomorrow}`
                )
            );

        const riderStats = stats[0] || {
            totalDeliveries: 0,
            completedDeliveries: 0,
            totalEarnings: 0,
            averageRating: 5,
        };

        res.status(200).json({
            success: true,
            data: {
                ...riderStats,
                todayDeliveries: todayDeliveries[0].count,
                totalEarnings: riderStats.totalEarnings || 0,
            },
        });
    } catch (error) {
        console.error("Error getting rider statistics:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};