import { format } from 'date-fns';

// Format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Format date
export const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
};

// Format date and time
export const formatDateTime = (date) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

// Capitalize first letter
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get stock status
export const getStockStatus = (quantity, minStockLevel) => {
    if (quantity === 0) return { status: 'out', color: 'red', text: 'Out of Stock' };
    if (quantity <= minStockLevel) return { status: 'low', color: 'yellow', text: 'Low Stock' };
    return { status: 'in', color: 'green', text: 'In Stock' };
};

// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Debounce function
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

// Units mapping
export const UNITS = {
    kg: 'Kilogram',
    grams: 'Grams',
    ml: 'Milliliter',
    litre: 'Liter',
    pieces: 'Pieces',
    dozen: 'Dozen',
    packet: 'Packet',
    bottle: 'Bottle',
    can: 'Can'
};

// Role mapping
export const ROLES = {
    admin: 'Administrator',
    viewer: 'Viewer'
};

// Order status mapping
export const ORDER_STATUS = {
    placed: { text: 'Placed', color: 'blue' },
    cancelled: { text: 'Cancelled', color: 'red' },
    completed: { text: 'Completed', color: 'green' }
};
