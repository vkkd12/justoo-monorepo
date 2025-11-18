import db from '../config/dbConfig.js';
import { customerAddresses } from '@justoo/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response.js';

// Get customer's addresses
export const getCustomerAddresses = async (req, res) => {
    try {
        const customerId = req.customer.id;

        const addresses = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isActive} = 1`
            ))
            .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.updatedAt));

        return successResponse(res, 'Addresses retrieved successfully', addresses);
    } catch (error) {
        console.error('Get customer addresses error:', error);
        return errorResponse(res, 'Failed to retrieve addresses', 500);
    }
};

// Get address by ID
export const getAddressById = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { addressId } = req.params;

        const address = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.id, parseInt(addressId)),
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isActive} = 1`
            ))
            .limit(1);

        if (address.length === 0) {
            return errorResponse(res, 'Address not found', 404);
        }

        return successResponse(res, 'Address retrieved successfully', address[0]);
    } catch (error) {
        console.error('Get address by ID error:', error);
        return errorResponse(res, 'Failed to retrieve address', 500);
    }
};

// Add new address
export const addAddress = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const {
            type = 'home',
            label,
            fullAddress,
            landmark,
            latitude,
            longitude,
            pincode,
            city,
            state,
            country = 'India',
            isDefault = false
        } = req.body;

        // Validation
        if (!fullAddress) {
            return errorResponse(res, 'Full address is required', 400);
        }

        if (type && !['home', 'work', 'other'].includes(type)) {
            return errorResponse(res, 'Invalid address type. Must be home, work, or other', 400);
        }

        // If setting as default, unset other default addresses
        if (isDefault) {
            await db
                .update(customerAddresses)
                .set({ isDefault: 0 })
                .where(eq(customerAddresses.customerId, customerId));
        }

        // Create address
        const newAddress = await db
            .insert(customerAddresses)
            .values({
                customerId,
                type,
                label,
                fullAddress,
                landmark,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                pincode,
                city,
                state,
                country,
                isDefault: isDefault ? 1 : 0,
                isActive: 1
            })
            .returning();

        return successResponse(res, 'Address added successfully', newAddress[0], 201);
    } catch (error) {
        console.error('Add address error:', error);
        return errorResponse(res, 'Failed to add address', 500);
    }
};

// Update address
export const updateAddress = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { addressId } = req.params;
        const {
            type,
            label,
            fullAddress,
            landmark,
            latitude,
            longitude,
            pincode,
            city,
            state,
            country,
            isDefault
        } = req.body;

        // Check if address exists and belongs to customer
        const existingAddress = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.id, parseInt(addressId)),
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isActive} = 1`
            ))
            .limit(1);

        if (existingAddress.length === 0) {
            return errorResponse(res, 'Address not found', 404);
        }

        // Validation
        if (type && !['home', 'work', 'other'].includes(type)) {
            return errorResponse(res, 'Invalid address type. Must be home, work, or other', 400);
        }

        // If setting as default, unset other default addresses
        if (isDefault) {
            await db
                .update(customerAddresses)
                .set({ isDefault: 0 })
                .where(and(
                    eq(customerAddresses.customerId, customerId),
                    sql`${customerAddresses.id} != ${parseInt(addressId)}`
                ));
        }

        // Update address
        const updateData = {
            updatedAt: new Date()
        };

        if (type !== undefined) updateData.type = type;
        if (label !== undefined) updateData.label = label;
        if (fullAddress !== undefined) updateData.fullAddress = fullAddress;
        if (landmark !== undefined) updateData.landmark = landmark;
        if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (country !== undefined) updateData.country = country;
        if (isDefault !== undefined) updateData.isDefault = isDefault ? 1 : 0;

        const updatedAddress = await db
            .update(customerAddresses)
            .set(updateData)
            .where(eq(customerAddresses.id, parseInt(addressId)))
            .returning();

        return successResponse(res, 'Address updated successfully', updatedAddress[0]);
    } catch (error) {
        console.error('Update address error:', error);
        return errorResponse(res, 'Failed to update address', 500);
    }
};

// Delete address (soft delete)
export const deleteAddress = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { addressId } = req.params;

        // Check if address exists and belongs to customer
        const existingAddress = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.id, parseInt(addressId)),
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isActive} = 1`
            ))
            .limit(1);

        if (existingAddress.length === 0) {
            return errorResponse(res, 'Address not found', 404);
        }

        // Check if this is the default address
        if (existingAddress[0].isDefault) {
            return errorResponse(res, 'Cannot delete default address. Please set another address as default first', 400);
        }

        // Soft delete
        await db
            .update(customerAddresses)
            .set({
                isActive: 0,
                updatedAt: new Date()
            })
            .where(eq(customerAddresses.id, parseInt(addressId)));

        return successResponse(res, 'Address deleted successfully');
    } catch (error) {
        console.error('Delete address error:', error);
        return errorResponse(res, 'Failed to delete address', 500);
    }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { addressId } = req.params;

        // Check if address exists and belongs to customer
        const existingAddress = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.id, parseInt(addressId)),
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isActive} = 1`
            ))
            .limit(1);

        if (existingAddress.length === 0) {
            return errorResponse(res, 'Address not found', 404);
        }

        // Start transaction to ensure consistency
        await db.transaction(async (tx) => {
            // Unset all default addresses for this customer
            await tx
                .update(customerAddresses)
                .set({ isDefault: 0 })
                .where(eq(customerAddresses.customerId, customerId));

            // Set the new default address
            await tx
                .update(customerAddresses)
                .set({
                    isDefault: 1,
                    updatedAt: new Date()
                })
                .where(eq(customerAddresses.id, parseInt(addressId)));
        });

        return successResponse(res, 'Default address updated successfully');
    } catch (error) {
        console.error('Set default address error:', error);
        return errorResponse(res, 'Failed to set default address', 500);
    }
};

// Get default address
export const getDefaultAddress = async (req, res) => {
    try {
        const customerId = req.customer.id;

        const defaultAddress = await db
            .select()
            .from(customerAddresses)
            .where(and(
                eq(customerAddresses.customerId, customerId),
                sql`${customerAddresses.isDefault} = 1`,
                sql`${customerAddresses.isActive} = 1`
            ))
            .limit(1);

        if (defaultAddress.length === 0) {
            return errorResponse(res, 'No default address found', 404);
        }

        return successResponse(res, 'Default address retrieved successfully', defaultAddress[0]);
    } catch (error) {
        console.error('Get default address error:', error);
        return errorResponse(res, 'Failed to retrieve default address', 500);
    }
};

// Validate address coordinates
export const validateAddress = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return errorResponse(res, 'Latitude and longitude are required', 400);
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return errorResponse(res, 'Invalid latitude or longitude values', 400);
        }

        // Simplified address validation - just check if coordinates are valid
        // Since delivery fees are now amount-based, we don't need complex zone validation
        return successResponse(res, 'Address validation completed', {
            isValid: true,
            inServiceArea: true, // Simplified - all valid coordinates are in service area
            estimatedDeliveryTime: 60 // Default 60 minutes delivery time
        });
    } catch (error) {
        console.error('Validate address error:', error);
        return errorResponse(res, 'Failed to validate address', 500);
    }
};