'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { inventoryAPI } from '@/lib/api';
import { formatCurrency, getStockStatus, UNITS } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
    PencilIcon,
    TrashIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ItemDetailPage() {
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const itemId = params.id;
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const loadItem = async () => {
            try {
                setIsLoading(true);
                const response = await inventoryAPI.getItemById(itemId);
                setItem(response.data.data);
            } catch (error) {
                console.error('Error loading item:', error);
                const message = error.response?.data?.message || 'Failed to load item';
                toast.error(message);
                router.push('/dashboard/inventory');
            } finally {
                setIsLoading(false);
            }
        };

        if (itemId) {
            loadItem();
        }
    }, [itemId, router]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            await inventoryAPI.deleteItem(itemId);
            toast.success('Item deleted successfully');
            router.push('/dashboard/inventory');
        } catch (error) {
            toast.error('Failed to delete item');
            console.error('Delete item error:', error);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-96">
                    <LoadingSpinner />
                </div>
            </DashboardLayout>
        );
    }

    if (!item) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Item not found</h3>
                    <p className="text-gray-500 mb-4">The item you're looking for could not be found.</p>
                    <button
                        onClick={() => router.push('/dashboard/inventory')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Back to Inventory
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const stockStatus = getStockStatus(item.quantity, item.minStockLevel);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/dashboard/inventory')}
                            className="inline-flex items-center text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-1" />
                            Back to Inventory
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Item ID: {item.id}
                            </p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex space-x-3">
                            <Link
                                href={`/dashboard/inventory/edit/${item.id}`}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Item Details */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Basic Information
                                </h3>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{item.name}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{item.category || 'Uncategorized'}</dd>
                                </div>

                                {item.description && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{item.description}</dd>
                                    </div>
                                )}

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd className="mt-1">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </dd>
                                </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                    Pricing & Stock
                                </h3>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(item.price)}
                                        {item.discount > 0 && (
                                            <span className="ml-2 text-sm text-green-600">
                                                ({item.discount}% discount)
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Current Stock</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">
                                                {item.quantity} {UNITS[item.unit] || item.unit}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${stockStatus.color}-100 text-${stockStatus.color}-800`}>
                                                {stockStatus.text}
                                            </span>
                                        </div>
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Minimum Stock Level</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {item.minStockLevel} {UNITS[item.unit] || item.unit}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Unit</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {UNITS[item.unit] || item.unit}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Total Value</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatCurrency(item.price * item.quantity)}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Record Information
                            </h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(item.updatedAt).toLocaleString()}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
