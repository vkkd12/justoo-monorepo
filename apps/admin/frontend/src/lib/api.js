import axios from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_ADMIN_BACKEND_API_URL || "http://localhost:3000") + "/admin/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Keep interceptors minimal; let callers handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    refreshToken: () => api.post('/auth/refresh'),
};

// Admin Management API
export const adminAPI = {
    getAllAdmins: (params) => api.get('/admin', { params }),
    addAdmin: (data) => api.post('/admin/add', data),
    deleteAdmin: (id) => api.delete(`/admin/${id}`),
    getAllUsers: (params) => api.get('/admin/users', { params }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getDashboardAnalytics: () => api.get('/admin/analytics/dashboard'),
    getUserAnalytics: (params) => api.get('/admin/analytics/users', { params }),
    getOrderAnalytics: (params) => api.get('/admin/analytics/orders', { params }),
    getInventoryAnalytics: (params) => api.get('/admin/analytics/inventory', { params }),
    getPaymentAnalytics: (params) => api.get('/admin/analytics/payments', { params }),
};

// Inventory API
export const inventoryAPI = {
    getAllItems: (params) => api.get('/inventory', { params }),
    getItemAnalytics: (params) => api.get('/inventory/analytics', { params }),
    getLowStockItems: (params) => api.get('/inventory/low-stock', { params }),
};

// Inventory Admin Management API
export const inventoryAdminAPI = {
    getAllInventoryAdmins: (params) => api.get('/admin/inventory-admins', { params }),
    getInventoryAdminById: (id) => api.get(`/admin/inventory-admins/${id}`),
    createInventoryAdmin: (data) => api.post('/admin/inventory-admins', data),
    updateInventoryAdmin: (id, data) => api.put(`/admin/inventory-admins/${id}`, data),
    deleteInventoryAdmin: (id) => api.delete(`/admin/inventory-admins/${id}`),
    toggleInventoryAdminStatus: (id) => api.patch(`/admin/inventory-admins/${id}/toggle-status`),
};

// Rider API
export const riderAPI = {
    getAllRiders: (params) => api.get('/riders', { params }),
    addRider: (data) => api.post('/riders', data),
    getRiderById: (id) => api.get(`/riders/${id}`),
    updateRider: (id, data) => api.put(`/riders/${id}`, data),
    deleteRider: (id) => api.delete(`/riders/${id}`),
    changeRiderPassword: (id, data) => api.put(`/riders/${id}/password`, data),
    getRiderAnalytics: (params) => api.get('/riders/analytics', { params }),
};

// Orders API
export const ordersAPI = {
    getAllOrders: (params) => api.get('/orders', { params }),
    getOrderById: (id) => api.get(`/orders/${id}`),
    getOrderAnalytics: (params) => api.get('/orders/analytics', { params }),
};

export default api;
