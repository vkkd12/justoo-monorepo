import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/dbConfig.js';
import { customers } from '@justoo/db';
import { eq, or } from 'drizzle-orm';
import env from '../config/env.js';
import { successResponse, errorResponse, validatePhone, validateEmail } from '../utils/response.js';

// Register new customer
export const register = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        // Validation
        if (!name || !phone || !password) {
            return errorResponse(res, 'Name, phone, and password are required', 400);
        }

        if (name.length < 2) {
            return errorResponse(res, 'Name must be at least 2 characters long', 400);
        }

        if (!validatePhone(phone)) {
            return errorResponse(res, 'Please provide a valid phone number', 400);
        }

        if (password.length < 6) {
            return errorResponse(res, 'Password must be at least 6 characters long', 400);
        }

        if (email && !validateEmail(email)) {
            return errorResponse(res, 'Please provide a valid email address', 400);
        }

        // Check if phone already exists
        const existingPhone = await db
            .select()
            .from(customers)
            .where(eq(customers.phone, phone))
            .limit(1);

        if (existingPhone.length > 0) {
            return errorResponse(res, 'Phone number already registered', 409);
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await db
                .select()
                .from(customers)
                .where(eq(customers.email, email))
                .limit(1);

            if (existingEmail.length > 0) {
                return errorResponse(res, 'Email already registered', 409);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(env.BCRYPT_ROUNDS));

        // Create customer
        const newCustomer = await db
            .insert(customers)
            .values({
                name,
                phone,
                email: email || null,
                password: hashedPassword,
                isActive: 1,
                status: 'active'
            })
            .returning();

        // Generate JWT token
        const token = jwt.sign(
            { id: newCustomer[0].id, phone: newCustomer[0].phone },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const { password: _, ...customerWithoutPassword } = newCustomer[0];

        return successResponse(res, 'Customer registered successfully', {
            customer: customerWithoutPassword,
            token
        }, 201);
    } catch (error) {
        console.error('Registration error:', error);
        return errorResponse(res, 'Failed to register customer', 500);
    }
};

// Login customer
export const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validation
        if (!phone || !password) {
            return errorResponse(res, 'Phone and password are required', 400);
        }

        // Find customer
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.phone, phone))
            .limit(1);

        if (customer.length === 0) {
            return errorResponse(res, 'Invalid phone or password', 401);
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, customer[0].password);
        if (!isValidPassword) {
            return errorResponse(res, 'Invalid phone or password', 401);
        }

        // Check if account is active
        if (customer[0].isActive === 0) {
            return errorResponse(res, 'Account is deactivated', 401);
        }

        if (customer[0].status !== 'active') {
            return errorResponse(res, 'Account is not active', 401);
        }

        // Update last login
        await db
            .update(customers)
            .set({ lastLogin: new Date() })
            .where(eq(customers.id, customer[0].id));

        // Generate JWT token
        const token = jwt.sign(
            { id: customer[0].id, phone: customer[0].phone },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const { password: _, ...customerWithoutPassword } = customer[0];

        return successResponse(res, 'Login successful', {
            customer: customerWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Failed to login', 500);
    }
};

// Get customer profile
export const getProfile = async (req, res) => {
    try {
        const customer = await db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                profileImage: customers.profileImage,
                dateOfBirth: customers.dateOfBirth,
                gender: customers.gender,
                status: customers.status,
                totalOrders: customers.totalOrders,
                totalSpent: customers.totalSpent,
                averageRating: customers.averageRating,
                lastOrderDate: customers.lastOrderDate,
                preferredPaymentMethod: customers.preferredPaymentMethod,
                isActive: customers.isActive,
                emailVerified: customers.emailVerified,
                phoneVerified: customers.phoneVerified,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt
            })
            .from(customers)
            .where(eq(customers.id, req.customer.id))
            .limit(1);

        if (customer.length === 0) {
            return errorResponse(res, 'Customer not found', 404);
        }

        return successResponse(res, 'Profile retrieved successfully', customer[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        return errorResponse(res, 'Failed to retrieve profile', 500);
    }
};

// Update customer profile
export const updateProfile = async (req, res) => {
    try {
        const { name, email, dateOfBirth, gender, profileImage } = req.body;

        // Validation
        if (name && name.length < 2) {
            return errorResponse(res, 'Name must be at least 2 characters long', 400);
        }

        if (email && !validateEmail(email)) {
            return errorResponse(res, 'Please provide a valid email address', 400);
        }

        // Check if email is already taken by another customer
        if (email) {
            const existingEmail = await db
                .select()
                .from(customers)
                .where(eq(customers.email, email))
                .limit(1);

            if (existingEmail.length > 0 && existingEmail[0].id !== req.customer.id) {
                return errorResponse(res, 'Email already taken', 409);
            }
        }

        // Update customer
        const updateData = {
            updatedAt: new Date()
        };

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
        if (gender !== undefined) updateData.gender = gender;
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        const updatedCustomer = await db
            .update(customers)
            .set(updateData)
            .where(eq(customers.id, req.customer.id))
            .returning();

        const { password: _, ...customerWithoutPassword } = updatedCustomer[0];

        return successResponse(res, 'Profile updated successfully', customerWithoutPassword);
    } catch (error) {
        console.error('Update profile error:', error);
        return errorResponse(res, 'Failed to update profile', 500);
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 'Current password and new password are required', 400);
        }

        if (newPassword.length < 6) {
            return errorResponse(res, 'New password must be at least 6 characters long', 400);
        }

        // Get customer with password
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, req.customer.id))
            .limit(1);

        if (customer.length === 0) {
            return errorResponse(res, 'Customer not found', 404);
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, customer[0].password);
        if (!isValidPassword) {
            return errorResponse(res, 'Current password is incorrect', 400);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(env.BCRYPT_ROUNDS));

        // Update password
        await db
            .update(customers)
            .set({
                password: hashedPassword,
                updatedAt: new Date()
            })
            .where(eq(customers.id, req.customer.id));

        return successResponse(res, 'Password changed successfully');
    } catch (error) {
        console.error('Change password error:', error);
        return errorResponse(res, 'Failed to change password', 500);
    }
};

// Logout
export const logout = async (req, res) => {
    try {
        // Clear cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return successResponse(res, 'Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        return errorResponse(res, 'Failed to logout', 500);
    }
};