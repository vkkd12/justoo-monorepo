'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
    UsersIcon,
    ShoppingBagIcon,
    TruckIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const StatsCard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color]}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd className="text-lg font-medium text-gray-900">{value}</dd>
                        </dl>
                    </div>
                </div>
            </div>
            {change && (
                <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                        <span className={`flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                            {changeType === 'increase' ? (
                                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                            ) : (
                                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                            )}
                            {change}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

const RecentActivity = ({ activities }) => {
    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="flow-root">
                    <ul className="-mb-8">
                        {activities.map((activity, index) => (
                            <li key={activity.id}>
                                <div className="relative pb-8">
                                    {index !== activities.length - 1 && (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    )}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span
                                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.type === 'order'
                                                    ? 'bg-green-500'
                                                    : activity.type === 'admin'
                                                        ? 'bg-blue-500'
                                                        : activity.type === 'rider'
                                                            ? 'bg-purple-500'
                                                            : 'bg-gray-500'
                                                    }`}
                                            >
                                                {activity.type === 'order' && <ShoppingBagIcon className="w-4 h-4 text-white" />}
                                                {activity.type === 'admin' && <UsersIcon className="w-4 h-4 text-white" />}
                                                {activity.type === 'rider' && <TruckIcon className="w-4 h-4 text-white" />}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-gray-500">{activity.description}</p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">{activity.time}</div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeRiders: 0, inventoryAdmins: 0 });
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const resp = await adminAPI.getDashboardAnalytics();
            const payload = resp?.data?.data || {};
            // Map expected stats from dashboard payload if available
            setStats({
                totalOrders: payload?.orders?.summary?.totalOrders ?? payload?.orders?.totalOrders ?? 0,
                totalRevenue: payload?.payments?.totalRevenue ?? payload?.orders?.summary?.totalRevenue ?? 0,
                activeRiders: payload?.users?.activeRiders ?? 0,
                inventoryAdmins: payload?.users?.inventoryAdmins ?? 0,
            });

            setActivities(
                payload?.recentActivities ?? [
                    { id: 1, type: 'order', description: 'New order #ORD-001 placed', time: '2 minutes ago' },
                    { id: 2, type: 'admin', description: 'New inventory admin added', time: '1 hour ago' },
                    { id: 3, type: 'rider', description: 'Rider John completed delivery', time: '2 hours ago' },
                    { id: 4, type: 'order', description: 'Order #ORD-002 delivered', time: '3 hours ago' },
                ]
            );
        } catch (err) {
            toast.error('Failed to load dashboard data');
            setActivities([
                { id: 1, type: 'order', description: 'New order #ORD-001 placed', time: '2 minutes ago' },
                { id: 2, type: 'admin', description: 'New inventory admin added', time: '1 hour ago' },
                { id: 3, type: 'rider', description: 'Rider John completed delivery', time: '2 hours ago' },
                { id: 4, type: 'order', description: 'Order #ORD-002 delivered', time: '3 hours ago' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
                <p className="mt-1 text-sm text-gray-500">Here's what's happening with your business today.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard title="Total Orders" value={stats.totalOrders.toLocaleString()} change="+12% from last month" changeType="increase" icon={ShoppingBagIcon} color="blue" />
                <StatsCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change="+8% from last month" changeType="increase" icon={CurrencyDollarIcon} color="green" />
                <StatsCard title="Active Riders" value={stats.activeRiders} change="+2 new this week" changeType="increase" icon={TruckIcon} color="purple" />
                {user?.role === 'superadmin' && (
                    <StatsCard title="Inventory Admins" value={stats.inventoryAdmins} change="+1 this month" changeType="increase" icon={UsersIcon} color="orange" />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue Overview</h3>
                            <ChartBarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">Chart component would go here</p>
                                <p className="text-sm text-gray-400">Integration with chart library needed</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <RecentActivity activities={activities} />
                </div>
            </div>
        </div>
    );
}
