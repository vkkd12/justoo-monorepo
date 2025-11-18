import jwt from 'jsonwebtoken';
import db from '../config/dbConfig.js';
import { customers } from '@justoo/db';
import { eq } from 'drizzle-orm';
import env from '../config/env.js';

// Authenticate customer token
export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // Get customer from database
        const customer = await db
            .select({
                id: customers.id,
                phone: customers.phone,
                email: customers.email,
                name: customers.name,
                status: customers.status,
                isActive: customers.isActive
            })
            .from(customers)
            .where(eq(customers.id, decoded.id))
            .limit(1);

        if (customer.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Customer not found'
            });
        }

        if (customer[0].isActive === 0) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        if (customer[0].status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is not active'
            });
        }

        // Attach customer to request
        req.customer = customer[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            req.customer = null;
            return next();
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);

        const customer = await db
            .select({
                id: customers.id,
                phone: customers.phone,
                email: customers.email,
                name: customers.name,
                status: customers.status,
                isActive: customers.isActive
            })
            .from(customers)
            .where(eq(customers.id, decoded.id))
            .limit(1);

        if (customer.length > 0 && customer[0].isActive === 1 && customer[0].status === 'active') {
            req.customer = customer[0];
        } else {
            req.customer = null;
        }

        next();
    } catch (error) {
        req.customer = null;
        next();
    }
};