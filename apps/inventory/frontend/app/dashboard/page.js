'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { inventoryAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
    CubeIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await inventoryAPI.getDashboardStats();
            setStats(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard stats');
            console.error('Dashboard stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner />
            </DashboardLayout>
        );
    }

    const statCards = [
        {
            name: 'Total Items',
            stat: stats?.totalItems || 0,
            icon: CubeIcon,
            color: 'bg-blue-500',
        },
        {
            name: 'In Stock Items',
            stat: stats?.inStockItems || 0,
            icon: ChartBarIcon,
            color: 'bg-green-500',
        },
        {
            name: 'Out of Stock',
            stat: stats?.outOfStockItems || 0,
            icon: ExclamationTriangleIcon,
            color: 'bg-red-500',
        },
        {
            name: 'Low Stock Items',
            stat: stats?.lowStockItems || 0,
            icon: ExclamationTriangleIcon,
            color: 'bg-yellow-500',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Overview of your inventory management system
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((item) => (
                        <div
                            key={item.name}
                            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
                        >
                            <dt>
                                <div className={`absolute rounded-md p-3 ${item.color}`}>
                                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </div>
                                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                                    {item.name}
                                </p>
                            </dt>
                            <dd className="ml-16 flex items-baseline">
                                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                            </dd>
                        </div>
                    ))}
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Quick Actions */}
                    <div className="rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Quick Actions
                            </h3>
                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => window.location.href = '/dashboard/inventory/add'}
                                >
                                    <CubeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    Add Item
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => window.location.href = '/dashboard/inventory'}
                                >
                                    <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    View Inventory
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => window.location.href = '/dashboard/orders'}
                                >
                                    <ShoppingCartIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    View Orders
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={() => window.location.href = '/dashboard/reports'}
                                >
                                    <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    Reports
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                System Information
                            </h3>
                            <div className="mt-5 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Total Value</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(stats?.totalValue || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Active Items</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {stats?.activeItems || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Inactive Items</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {stats?.inactiveItems || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Last Updated</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
