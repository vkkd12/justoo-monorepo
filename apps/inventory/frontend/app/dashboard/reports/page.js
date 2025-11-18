'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { inventoryAPI, orderAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
    ChartBarIcon,
    DocumentChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const [dashboardStats, setDashboardStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const [statsResponse, ordersResponse] = await Promise.all([
                inventoryAPI.getDashboardStats(),
                orderAPI.getAllOrders({ limit: 10 })
            ]);
            console.log(ordersResponse, statsResponse);
            setDashboardStats(statsResponse.data.data);
            setRecentOrders(ordersResponse.data.data);
        } catch (error) {
            toast.error('Failed to fetch report data');
            console.error('Report data error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    const reportCards = [
        {
            title: 'Inventory Overview',
            stats: [
                { label: 'Total Items', value: dashboardStats?.totalItems || 0 },
                { label: 'Total Value', value: formatCurrency(dashboardStats?.totalInventoryValue || 0) },
                { label: 'In Stock', value: dashboardStats?.inStockItems || 0 },
                { label: 'Out of Stock', value: dashboardStats?.outOfStockItems || 0 },
            ],
            icon: ChartBarIcon,
            color: 'blue'
        },
        {
            title: 'Stock Alerts',
            stats: [
                { label: 'Low Stock Items', value: dashboardStats?.lowStockItems || 0 },
                { label: 'Critical Items', value: dashboardStats?.outOfStockItems || 0 },
                { label: 'Active Items', value: dashboardStats?.activeItems || 0 },
                { label: 'Inactive Items', value: dashboardStats?.inactiveItems || 0 },
            ],
            icon: ArrowTrendingDownIcon,
            color: 'red'
        },
        {
            title: 'Recent Activity',
            stats: [
                { label: 'Recent Orders', value: recentOrders.length },
                { label: 'Total Order Value', value: formatCurrency(recentOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)) },
                { label: 'Avg Order Value', value: formatCurrency(recentOrders.length > 0 ? recentOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) / recentOrders.length : 0) },
                { label: 'Items Ordered', value: recentOrders.reduce((sum, order) => sum + order.itemCount, 0) },
            ],
            icon: ArrowTrendingUpIcon,
            color: 'green'
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Overview of your inventory performance and key metrics.
                    </p>
                </div>

                {/* Report Cards */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {reportCards.map((card, index) => (
                        <div key={index} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                                        <card.icon className={`h-6 w-6 text-${card.color}-600`} />
                                    </div>
                                    <h3 className="ml-3 text-lg font-medium text-gray-900">{card.title}</h3>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <dl className="grid grid-cols-1 gap-4">
                                    {card.stats.map((stat, statIndex) => (
                                        <div key={statIndex} className="flex justify-between">
                                            <dt className="text-sm font-medium text-gray-500">{stat.label}</dt>
                                            <dd className="text-sm font-semibold text-gray-900">{stat.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center">
                            <DocumentChartBarIcon className="h-6 w-6 text-gray-400" />
                            <h3 className="ml-3 text-lg font-medium text-gray-900">Recent Orders</h3>
                        </div>
                    </div>
                    <div className="px-6 py-4">
                        {recentOrders.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No recent orders found</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {recentOrders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    #{order.id}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {order.itemCount}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(order.totalAmount)}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Export Actions */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <button
                            onClick={() => toast.info('Inventory export feature coming soon')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Export Inventory
                        </button>
                        <button
                            onClick={() => toast.info('Orders export feature coming soon')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Export Orders
                        </button>
                        <button
                            onClick={() => toast.info('Report generation feature coming soon')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
