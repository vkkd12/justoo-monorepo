// Auth Controller
import db from '../config/dbConfig.js';
import { findByUsername } from '../utils/db.js';
import { comparePassword, generateToken, extractTokenFromHeader, hashPassword } from '../utils/auth.js';
import { unauthorizedResponse, errorResponse, successResponse } from '../utils/response.js';
import { justoo_admins as admin } from '@justoo/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;

export const signin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return errorResponse(res, 'Username and password are required', 400);
    }

    try {
        let user = await findByUsername(admin, username);
        let tableName = 'admin';

        if (!user) {
            return unauthorizedResponse(res, 'Invalid username or password');
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return unauthorizedResponse(res, 'Invalid username or password');
        }

        const token = generateToken({
            id: user.id,
            username: user.username,
            userType: tableName,
            role: user.role
        });

        // Set httpOnly cookie for session
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return successResponse(res, 'Signed in successfully', {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                userType: tableName
            }
        });
    } catch (error) {
        console.error('Error signing in:', error);
        return errorResponse(res, 'Error signing in');
    }
};

export const signout = (req, res) => {
    res.clearCookie('auth_token');
    return successResponse(res, null, 'Signed out successfully');
};

export const getMe = async (req, res) => {
    try {
        const user = req.user;
        return successResponse(res, { user }, 'User info retrieved successfully');
    } catch (error) {
        console.error('Error getting user info:', error);
        return errorResponse(res, 'Error retrieving user info');
    }
};

export const refreshToken = async (req, res) => {
    try {
        const user = req.user;

        // Generate new token
        const newToken = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
            userType: user.userType
        });

        // Set new cookie
        res.cookie('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return successResponse(res, null, 'Token refreshed successfully');
    } catch (error) {
        console.error('Error refreshing token:', error);
        return errorResponse(res, 'Error refreshing token');
    }
};

// Update profile (username/email)
export const updateProfile = async (req, res) => {
    try {
        const user = req.user;
        const { username, email } = req.body;

        if (!username || !email) {
            return errorResponse(res, 'Username and email are required', 400);
        }

        // Basic validations
        if (username.length < 3) {
            return errorResponse(res, 'Username must be at least 3 characters long', 400);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return errorResponse(res, 'Please provide a valid email address', 400);
        }

        // Check uniqueness (excluding current user)
        const existingUsername = await db
            .select({ id: admin.id })
            .from(admin)
            .where(eq(admin.username, username))
            .limit(1);

        if (existingUsername.length && existingUsername[0].id !== user.id) {
            return errorResponse(res, 'Username already in use', 409);
        }

        const existingEmail = await db
            .select({ id: admin.id })
            .from(admin)
            .where(eq(admin.email, email))
            .limit(1);

        if (existingEmail.length && existingEmail[0].id !== user.id) {
            return errorResponse(res, 'Email already in use', 409);
        }

        const updated = await db
            .update(admin)
            .set({ username, email })
            .where(eq(admin.id, user.id))
            .returning({ id: admin.id, username: admin.username, email: admin.email, role: admin.role });

        if (!updated.length) {
            return errorResponse(res, 'Failed to update profile', 500);
        }

        return successResponse(res, { user: updated[0] }, 'Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        return errorResponse(res, 'Error updating profile');
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 'Current and new password are required', 400);
        }
        if (newPassword.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        // Get user with password
        const rows = await db
            .select({ id: admin.id, password: admin.password })
            .from(admin)
            .where(eq(admin.id, user.id))
            .limit(1);

        if (!rows.length) {
            return errorResponse(res, 'User not found', 404);
        }

        const currentPasswordHashed = await hashPassword(currentPassword);
        const isValid = await comparePassword(currentPasswordHashed, rows[0].password);
        if (!isValid) {
            return unauthorizedResponse(res, 'Current password is incorrect');
        }

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await db.update(admin).set({ password: hashed }).where(eq(admin.id, user.id));

        return successResponse(res, null, 'Password updated successfully');
    } catch (error) {
        console.error('Error changing password:', error);
        return errorResponse(res, 'Error changing password');
    }
};
