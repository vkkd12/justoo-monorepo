// Utility functions for the admin dashboard

// Format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

// Format date
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

// Format relative time
export const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
        return `${Math.floor(diffInDays)} days ago`;
    } else {
        return formatDate(date);
    }
};

// Get stock status
export const getStockStatus = (quantity, minStockLevel) => {
    if (quantity === 0) {
        return { text: 'Out of Stock', color: 'red' };
    } else if (quantity <= minStockLevel) {
        return { text: 'Low Stock', color: 'yellow' };
    } else {
        return { text: 'In Stock', color: 'green' };
    }
};

// Get order status badge
export const getOrderStatusBadge = (status) => {
    const statusMap = {
        placed: { text: 'Placed', color: 'blue' },
        processing: { text: 'Processing', color: 'yellow' },
        shipped: { text: 'Shipped', color: 'purple' },
        delivered: { text: 'Delivered', color: 'green' },
        cancelled: { text: 'Cancelled', color: 'red' },
        completed: { text: 'Completed', color: 'green' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
};

// Get admin role badge
export const getAdminRoleBadge = (role) => {
    const roleMap = {
        superadmin: { text: 'Super Admin', color: 'purple' },
        admin: { text: 'Admin', color: 'blue' },
        inventory_admin: { text: 'Inventory Admin', color: 'green' },
    };
    return roleMap[role] || { text: role, color: 'gray' };
};

// Get rider status badge
export const getRiderStatusBadge = (status) => {
    const statusMap = {
        active: { text: 'Active', color: 'green' },
        inactive: { text: 'Inactive', color: 'red' },
        busy: { text: 'Busy', color: 'yellow' },
        offline: { text: 'Offline', color: 'gray' },
    };
    return statusMap[status] || { text: status, color: 'gray' };
};

// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Generate random color for charts
export const generateColor = (index) => {
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
    ];
    return colors[index % colors.length];
};

// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number (Indian format)
export const isValidPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

// Units mapping
export const UNITS = {
    kg: 'Kilogram',
    grams: 'Grams',
    ml: 'Millilitre',
    litre: 'Litre',
    pieces: 'Pieces',
    dozen: 'Dozen',
    packet: 'Packet',
    bottle: 'Bottle',
    can: 'Can',
};

// Admin roles
export const ADMIN_ROLES = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    inventory_admin: 'Inventory Admin',
};

// Order statuses
export const ORDER_STATUSES = {
    placed: 'Placed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

// Rider statuses
export const RIDER_STATUSES = {
    active: 'Active',
    inactive: 'Inactive',
    busy: 'Busy',
    offline: 'Offline',
};
