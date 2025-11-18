import db from '../config/dbConfig.js';
import { items, orders, orderItems } from '@justoo/db';
import { eq, and, sql } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response.js';

// In-memory cart storage (in production, use Redis or database)
export const carts = new Map();

// Get customer's cart
export const getCart = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const cart = carts.get(customerId) || { items: [], total: 0, itemCount: 0 };

        // Validate cart items and update prices/availability
        const validatedCart = await validateCartItems(cart.items);

        // Update cart if items changed
        if (JSON.stringify(validatedCart.items) !== JSON.stringify(cart.items)) {
            carts.set(customerId, validatedCart);
        }

        return successResponse(res, 'Cart retrieved successfully', validatedCart);
    } catch (error) {
        console.error('Get cart error:', error);
        return errorResponse(res, 'Failed to retrieve cart', 500);
    }
};

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { itemId, quantity = 1 } = req.body;

        if (!itemId || quantity < 1) {
            return errorResponse(res, 'Valid item ID and quantity are required', 400);
        }

        // Get item details
        const item = await db
            .select()
            .from(items)
            .where(and(
                eq(items.id, parseInt(itemId)),
                sql`${items.isActive} = 1`
            ))
            .limit(1);

        if (item.length === 0) {
            return errorResponse(res, 'Item not found or unavailable', 404);
        }

        if (item[0].quantity < quantity) {
            return errorResponse(res, `Only ${item[0].quantity} items available in stock`, 400);
        }

        // Get or create cart
        let cart = carts.get(customerId) || { items: [], total: 0, itemCount: 0 };

        // Check if item already in cart
        const existingItemIndex = cart.items.findIndex(cartItem => cartItem.id === parseInt(itemId));

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > item[0].quantity) {
                return errorResponse(res, `Cannot add ${quantity} more items. Only ${item[0].quantity - cart.items[existingItemIndex].quantity} available`, 400);
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].totalPrice = newQuantity * parseFloat(item[0].price);
        } else {
            // Add new item
            const cartItem = {
                id: item[0].id,
                name: item[0].name,
                price: parseFloat(item[0].price),
                discount: parseFloat(item[0].discount || 0),
                unit: item[0].unit,
                quantity: quantity,
                totalPrice: quantity * parseFloat(item[0].price),
                image: item[0].image || null,
                availableQuantity: item[0].quantity
            };
            cart.items.push(cartItem);
        }

        // Recalculate totals
        cart = calculateCartTotals(cart);
        carts.set(customerId, cart);

        return successResponse(res, 'Item added to cart successfully', cart);
    } catch (error) {
        console.error('Add to cart error:', error);
        return errorResponse(res, 'Failed to add item to cart', 500);
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!itemId || quantity === undefined || quantity < 0) {
            return errorResponse(res, 'Valid item ID and quantity are required', 400);
        }

        const cart = carts.get(customerId);
        if (!cart) {
            return errorResponse(res, 'Cart not found', 404);
        }

        const itemIndex = cart.items.findIndex(item => item.id === parseInt(itemId));
        if (itemIndex === -1) {
            return errorResponse(res, 'Item not found in cart', 404);
        }

        if (quantity === 0) {
            // Remove item from cart
            cart.items.splice(itemIndex, 1);
        } else {
            // Check stock availability
            const item = await db
                .select()
                .from(items)
                .where(eq(items.id, parseInt(itemId)))
                .limit(1);

            if (item.length === 0 || item[0].quantity < quantity) {
                return errorResponse(res, `Only ${item[0]?.quantity || 0} items available in stock`, 400);
            }

            // Update quantity and total price
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].totalPrice = quantity * cart.items[itemIndex].price;
        }

        // Recalculate totals
        const updatedCart = calculateCartTotals(cart);
        carts.set(customerId, updatedCart);

        return successResponse(res, 'Cart item updated successfully', updatedCart);
    } catch (error) {
        console.error('Update cart item error:', error);
        return errorResponse(res, 'Failed to update cart item', 500);
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const { itemId } = req.params;

        const cart = carts.get(customerId);
        if (!cart) {
            return errorResponse(res, 'Cart not found', 404);
        }

        const itemIndex = cart.items.findIndex(item => item.id === parseInt(itemId));
        if (itemIndex === -1) {
            return errorResponse(res, 'Item not found in cart', 404);
        }

        // Remove item
        cart.items.splice(itemIndex, 1);

        // Recalculate totals
        const updatedCart = calculateCartTotals(cart);
        carts.set(customerId, updatedCart);

        return successResponse(res, 'Item removed from cart successfully', updatedCart);
    } catch (error) {
        console.error('Remove from cart error:', error);
        return errorResponse(res, 'Failed to remove item from cart', 500);
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        const customerId = req.customer.id;

        carts.delete(customerId);

        return successResponse(res, 'Cart cleared successfully', {
            items: [],
            total: 0,
            itemCount: 0
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        return errorResponse(res, 'Failed to clear cart', 500);
    }
};

// Validate cart items (check availability and update prices)
const validateCartItems = async (cartItems) => {
    const validatedItems = [];

    for (const cartItem of cartItems) {
        try {
            const item = await db
                .select()
                .from(items)
                .where(and(
                    eq(items.id, cartItem.id),
                    sql`${items.isActive} = 1`
                ))
                .limit(1);

            if (item.length > 0 && item[0].quantity >= cartItem.quantity) {
                // Item is available, update with current price
                validatedItems.push({
                    ...cartItem,
                    price: parseFloat(item[0].price),
                    totalPrice: cartItem.quantity * parseFloat(item[0].price),
                    availableQuantity: item[0].quantity
                });
            }
            // If item not available or insufficient stock, skip it
        } catch (error) {
            console.error(`Error validating item ${cartItem.id}:`, error);
            // Skip invalid items
        }
    }

    const cart = {
        items: validatedItems,
        total: 0,
        itemCount: 0
    };

    return calculateCartTotals(cart);
};

// Calculate cart totals
const calculateCartTotals = (cart) => {
    let total = 0;
    let itemCount = 0;

    cart.items.forEach(item => {
        total += item.totalPrice;
        itemCount += item.quantity;
    });

    cart.total = parseFloat(total.toFixed(2));
    cart.itemCount = itemCount;

    return cart;
};

// Get cart summary (for checkout)
export const getCartSummary = async (req, res) => {
    try {
        const customerId = req.customer.id;
        const cart = carts.get(customerId) || { items: [], total: 0, itemCount: 0 };

        // Validate cart items
        const validatedCart = await validateCartItems(cart.items);

        if (validatedCart.items.length === 0) {
            return errorResponse(res, 'Cart is empty', 400);
        }

        // Calculate delivery fee (40 rs if order < 100, otherwise free)
        const deliveryFee = validatedCart.total < 100 ? 40 : 0;
        const taxAmount = validatedCart.total * 0.05; // 5% tax
        const finalTotal = validatedCart.total + deliveryFee + taxAmount;

        const summary = {
            items: validatedCart.items,
            subtotal: validatedCart.total,
            deliveryFee,
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            total: parseFloat(finalTotal.toFixed(2)),
            itemCount: validatedCart.itemCount,
            freeDeliveryThreshold: 100
        };

        return successResponse(res, 'Cart summary retrieved successfully', summary);
    } catch (error) {
        console.error('Get cart summary error:', error);
        return errorResponse(res, 'Failed to retrieve cart summary', 500);
    }
};