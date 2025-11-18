'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
    Bars3Icon,
    BellIcon,
    ChevronDownIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Header({ setSidebarOpen }) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    return (
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
            <button
                type="button"
                className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex-1 px-4 flex justify-between items-center">
                <div className="flex-1 flex">
                    <div className="w-full flex md:ml-0">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Admin Dashboard
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="ml-4 flex items-center md:ml-6">
                    {/* Notifications */}
                    <button
                        type="button"
                        className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Profile dropdown */}
                    <Menu as="div" className="ml-3 relative">
                        <div>
                            <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <span className="sr-only">Open user menu</span>
                                <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </span>
                                </div>
                                <span className="ml-2 text-gray-700 text-sm font-medium">
                                    {user?.username}
                                </span>
                                <ChevronDownIcon className="ml-1 h-4 w-4 text-gray-400" />
                            </Menu.Button>
                        </div>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm text-gray-700 font-medium">{user?.username}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                </div>

                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={() => router.push('/dashboard/profile')}
                                            className={classNames(
                                                active ? 'bg-gray-100' : '',
                                                'flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                            )}
                                        >
                                            <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                                            Your Profile
                                        </button>
                                    )}
                                </Menu.Item>

                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={handleLogout}
                                            className={classNames(
                                                active ? 'bg-gray-100' : '',
                                                'flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                            )}
                                        >
                                            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                                            Sign out
                                        </button>
                                    )}
                                </Menu.Item>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>
        </div>
    );
}
