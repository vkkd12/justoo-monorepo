'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    EyeIcon,
    CurrencyRupeeIcon,
    CalendarDaysIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'preparing':
                return 'bg-purple-100 text-purple-800';
            case 'ready':
                return 'bg-indigo-100 text-indigo-800';
            case 'out_for_delivery':
                return 'bg-orange-100 text-orange-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
            {status?.replace('_', ' ')}
        </span>
    );
};

const OrderRow = ({ order, onViewDetails }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {order.order_id || order.id}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{order.customer_name}</div>
                <div className="text-sm text-gray-500">{order.customer_email}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{order.total_amount?.toFixed(2)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={order.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(order.created_at)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={() => onViewDetails(order)}
                    className="text-indigo-600 hover:text-indigo-900"
                >
                    <EyeIcon className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
};

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Order Details - {order.order_id || order.id}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Customer Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Name:</span>
                                        <p className="font-medium">{order.customer_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Email:</span>
                                        <p className="font-medium">{order.customer_email}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Phone:</span>
                                        <p className="font-medium">{order.customer_phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Address:</span>
                                        <p className="font-medium">{order.delivery_address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {order.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">₹{item.price}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-900">₹{(item.quantity * item.price).toFixed(2)}</td>
                                                </tr>
                                            )) || (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-2 text-sm text-gray-500 text-center">
                                                            No items available
                                                        </td>
                                                    </tr>
                                                )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Status:</span>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Amount:</span>
                                        <span className="font-medium">₹{order.total_amount?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Order Date:</span>
                                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {order.delivery_time && (
                                        <div className="flex justify-between">
                                            <span>Delivery Time:</span>
                                            <span>{new Date(order.delivery_time).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders');
            console.log(response);
            const ok = response?.data?.success;
            const payload = response?.data?.message?.orders;
            // console.log(payload);
            if (ok && payload) {
                const normalized = payload.map((o) => ({
                    id: o.id,
                    order_id: o.id,
                    customer_name: o.customerName || '',
                    customer_email: o.customerEmail || '',
                    total_amount: Number(o.totalAmount ?? 0),
                    status: o.status,
                    created_at: o.createdAt,
                    delivery_address: o.deliveryAddress,
                    items: o.items || [],
                }));
                console.log(normalized);
                setOrders(normalized);
            } else {
                setOrders([
                    {
                        id: 'ORD-001',
                        order_id: 'ORD-001',
                        customer_name: 'John Doe',
                        customer_email: 'john@example.com',
                        customer_phone: '+91 9876543210',
                        total_amount: 450.00,
                        status: 'delivered',
                        created_at: '2024-01-15T10:30:00Z',
                        delivery_address: '123 Main St, Bangalore',
                        items: [
                            { name: 'Product 1', quantity: 2, price: 200 },
                            { name: 'Product 2', quantity: 1, price: 50 }
                        ]
                    },
                    {
                        id: 'ORD-002',
                        order_id: 'ORD-002',
                        customer_name: 'Jane Smith',
                        customer_email: 'jane@example.com',
                        customer_phone: '+91 9876543211',
                        total_amount: 320.00,
                        status: 'out_for_delivery',
                        created_at: '2024-01-15T14:15:00Z',
                        delivery_address: '456 Oak Ave, Mumbai',
                        items: [
                            { name: 'Product 3', quantity: 1, price: 320 }
                        ]
                    },
                    {
                        id: 'ORD-003',
                        order_id: 'ORD-003',
                        customer_name: 'Bob Johnson',
                        customer_email: 'bob@example.com',
                        customer_phone: '+91 9876543212',
                        total_amount: 180.00,
                        status: 'preparing',
                        created_at: '2024-01-15T16:45:00Z',
                        delivery_address: '789 Pine Rd, Delhi',
                        items: [
                            { name: 'Product 4', quantity: 3, price: 60 }
                        ]
                    }
                ]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const getFilteredOrders = () => {
        return orders.filter(order => {
            const matchesSearch =
                String(order.order_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;

            let matchesDate = true;
            if (dateRange !== 'all') {
                const orderDate = new Date(order.created_at);
                const now = new Date();

                switch (dateRange) {
                    case 'today':
                        matchesDate = orderDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        matchesDate = orderDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        matchesDate = orderDate >= monthAgo;
                        break;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    };

    const filteredOrders = getFilteredOrders();

    const getTotalRevenue = () => {
        return filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    };

    return (
        <div>
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Orders Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track and manage all customer orders
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                                    <CurrencyRupeeIcon className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                    <dd className="text-lg font-medium text-gray-900">₹{getTotalRevenue().toFixed(2)}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                                    <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                    <dd className="text-lg font-medium text-gray-900">{filteredOrders.length}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                                    <FunnelIcon className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Average Order</dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        ₹{filteredOrders.length ? (getTotalRevenue() / filteredOrders.length).toFixed(2) : '0.00'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>

                        <div className="text-sm text-gray-500 flex items-center">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No orders found</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                order={selectedOrder}
            />
        </div>
    );
}
