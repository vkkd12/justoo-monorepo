'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { inventoryAPI } from '@/lib/api';
import { UNITS } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AddItemPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm({
        defaultValues: {
            name: '',
            description: '',
            price: '',
            quantity: '',
            minStockLevel: 10,
            discount: 0,
            unit: 'pieces',
            category: '',
            isActive: 1
        }
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();

            // Add all form fields
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                    formData.append(key, data[key]);
                }
            });

            // Add image if selected
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            await inventoryAPI.addItem(formData);
            toast.success('Item added successfully!');
            router.push('/dashboard/inventory');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add item';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="pb-6 border-b border-gray-200">
                    <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
                    <p className="mt-3 text-base text-gray-600">
                        Add a new item to your inventory system with all the necessary details.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white shadow-lg ring-1 ring-gray-900/10 rounded-xl overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-8">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            {/* Item Name */}
                            <div className="lg:col-span-2">
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    {...register('name', {
                                        required: 'Item name is required',
                                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                                    })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm"
                                    placeholder="Enter item name"
                                />
                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    {...register('category')}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm"
                                    placeholder="Enter category"
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label htmlFor="unit" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Unit *
                                </label>
                                <select
                                    {...register('unit', { required: 'Unit is required' })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 px-4 py-3 text-sm"
                                >
                                    {Object.entries(UNITS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                {errors.unit && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.unit.message}</p>
                                )}
                            </div>

                            {/* Price */}
                            <div>
                                <label htmlFor="price" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Price *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...register('price', {
                                            required: 'Price is required',
                                            min: { value: 0, message: 'Price must be positive' }
                                        })}
                                        className="block w-full pl-8 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.price && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.price.message}</p>
                                )}
                            </div>

                            {/* Discount */}
                            <div>
                                <label htmlFor="discount" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Discount (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        {...register('discount', {
                                            min: { value: 0, message: 'Discount cannot be negative' },
                                            max: { value: 100, message: 'Discount cannot exceed 100%' }
                                        })}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">%</span>
                                    </div>
                                </div>
                                {errors.discount && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.discount.message}</p>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Initial Quantity *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register('quantity', {
                                        required: 'Quantity is required',
                                        min: { value: 0, message: 'Quantity cannot be negative' }
                                    })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm"
                                    placeholder="0"
                                />
                                {errors.quantity && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.quantity.message}</p>
                                )}
                            </div>

                            {/* Min Stock Level */}
                            <div>
                                <label htmlFor="minStockLevel" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Minimum Stock Level *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    {...register('minStockLevel', {
                                        required: 'Minimum stock level is required',
                                        min: { value: 0, message: 'Minimum stock level cannot be negative' }
                                    })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm"
                                    placeholder="10"
                                />
                                {errors.minStockLevel && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.minStockLevel.message}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label htmlFor="isActive" className="block text-sm font-semibold text-gray-800 mb-2">
                                    Status
                                </label>
                                <select
                                    {...register('isActive')}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 px-4 py-3 text-sm"
                                >
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Item Image
                            </label>
                            <div className="space-y-4">
                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Item preview"
                                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}

                                {/* Upload Area */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            {selectedImage ? selectedImage.name : 'Click to upload image'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="inline-flex justify-center items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex justify-center items-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Adding...
                                    </div>
                                ) : (
                                    'Add Item'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
