'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UserIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const AdminCard = ({ admin, onEdit, onDelete, currentUserId }) => {
    const getRoleColor = (role) => {
        switch (role) {
            case 'superadmin':
                return 'bg-red-100 text-red-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            case 'inventory_admin':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{admin.username}</h3>
                                <p className="text-sm text-gray-500">{admin.email}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(admin.role)}`}>
                                {admin.role.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <ShieldCheckIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            Created on {formatDate(admin.created_at)}
                        </div>
                    </div>
                </div>

                {admin.id !== currentUserId && (
                    <div className="mt-4 flex justify-end space-x-2">
                        <button
                            onClick={() => onEdit(admin)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(admin)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminModal = ({ isOpen, onClose, onSubmit, admin, loading }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'inventory_admin',
    });

    useEffect(() => {
        if (admin) {
            setFormData({
                username: admin.username || '',
                email: admin.email || '',
                password: '',
                role: admin.role || 'inventory_admin',
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'inventory_admin',
            });
        }
    }, [admin, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {admin ? 'Edit Admin' : 'Add New Admin'}
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter username"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter email"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Password {admin && '(Leave blank to keep current)'}
                                            </label>
                                            <input
                                                type="password"
                                                required={!admin}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter password"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="inventory_admin">Inventory Admin</option>
                                                <option value="admin">Admin</option>
                                                <option value="superadmin">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (admin ? 'Update' : 'Create')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function AdminsPage() {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin');
            console.log(response);
            if (response.data.success) {

                setAdmins(response.data.data);
            } else {
                toast.error('Failed to fetch admins');
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            toast.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = () => {
        setEditingAdmin(null);
        setShowModal(true);
    };

    const handleEditAdmin = (admin) => {
        setEditingAdmin(admin);
        setShowModal(true);
    };

    const handleDeleteAdmin = async (admin) => {
        if (window.confirm(`Are you sure you want to delete ${admin.username}?`)) {
            try {
                const response = await api.delete(`/admin/${admin.id}`);

                if (response.success) {
                    toast.success('Admin deleted successfully');
                    fetchAdmins();
                } else {
                    toast.error(response.error || 'Failed to delete admin');
                }
            } catch (error) {
                console.error('Error deleting admin:', error);
                toast.error('Failed to delete admin');
            }
        }
    };

    const handleSubmitAdmin = async (formData) => {
        try {
            setSubmitting(true);

            let response;
            if (editingAdmin) {
                const updateData = { ...formData };
                if (!updateData.password) {
                    delete updateData.password;
                }
                response = await api.put(`/admin/${editingAdmin.id}`, updateData);
            } else {
                response = await api.post('/admin', formData);
            }

            if (response.success) {
                toast.success(`Admin ${editingAdmin ? 'updated' : 'created'} successfully`);
                setShowModal(false);
                fetchAdmins();
            } else {
                toast.error(response.error || `Failed to ${editingAdmin ? 'update' : 'create'} admin`);
            }
        } catch (error) {
            console.error('Error submitting admin:', error);
            toast.error(`Failed to ${editingAdmin ? 'update' : 'create'} admin`);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'all' || admin.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    if (user?.role !== 'superadmin') {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                <p className="text-gray-600">You don't have permission to manage admins.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Admin Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage system administrators and their permissions
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        onClick={handleAddAdmin}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Admin
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search admins..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="superadmin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="inventory_admin">Inventory Admin</option>
                            </select>
                        </div>

                        <div className="text-sm text-gray-500 flex items-center">
                            Showing {filteredAdmins.length} of {admins.length} admins
                        </div>
                    </div>
                </div>
            </div>

            {/* Admins Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredAdmins.length === 0 ? (
                <div className="text-center py-12">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || selectedRole !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Get started by adding a new admin.'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAdmins.map((admin) => (
                        <AdminCard
                            key={admin.id}
                            admin={admin}
                            onEdit={handleEditAdmin}
                            onDelete={handleDeleteAdmin}
                            currentUserId={user?.id}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <AdminModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmitAdmin}
                admin={editingAdmin}
                loading={submitting}
            />
        </div>
    );
}
