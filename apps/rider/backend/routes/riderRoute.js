import express from "express";
import {
    updateProfile,
    updatePassword,
    updateStatus,
    getRiderStats
} from "../controllers/riderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get rider profile
router.get("/profile", authMiddleware, (req, res) => {
    // This should use the getProfile from authController
    const { getProfile } = require("../controllers/authController.js");
    return getProfile(req, res);
});

// Update rider profile
router.put("/profile", authMiddleware, updateProfile);

// Update rider password
router.put("/password", authMiddleware, updatePassword);

// Update rider status
router.put("/status", authMiddleware, updateStatus);

// Get rider statistics
router.get("/stats", authMiddleware, getRiderStats);

export default router;
