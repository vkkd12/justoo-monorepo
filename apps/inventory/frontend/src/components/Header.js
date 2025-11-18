'use client';

import { useState } from 'react';
import { Bars3Icon, BellIcon, UserIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Header({ setSidebarOpen, user }) {
    const { logout } = useAuth();
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

    const userNavigation = [
        { name: 'Your profile', href: '/dashboard/profile' },
        { name: 'Sign out', onClick: handleLogout },
    ];

    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="relative flex flex-1 items-center">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900">
                        Inventory Management System
                    </h1>
                </div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    {/* Notifications button */}
                    <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative">
                        <MenuButton className="-m-1.5 flex items-center p-1.5">
                            <span className="sr-only">Open user menu</span>
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-white" />
                            </div>
                            <span className="hidden lg:flex lg:items-center">
                                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                    {user?.username}
                                </span>
                                <span className="ml-2 text-xs text-gray-500 capitalize">
                                    ({user?.role})
                                </span>
                            </span>
                        </MenuButton>
                        <MenuItems
                            transition
                            className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            {userNavigation.map((item) => (
                                <MenuItem key={item.name}>
                                    {({ focus }) => (
                                        item.onClick ? (
                                            <button
                                                onClick={item.onClick}
                                                className={classNames(
                                                    focus ? 'bg-gray-50' : '',
                                                    'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900'
                                                )}
                                            >
                                                {item.name}
                                            </button>
                                        ) : (
                                            <a
                                                href={item.href}
                                                className={classNames(
                                                    focus ? 'bg-gray-50' : '',
                                                    'block px-3 py-1 text-sm leading-6 text-gray-900'
                                                )}
                                            >
                                                {item.name}
                                            </a>
                                        )
                                    )}
                                </MenuItem>
                            ))}
                        </MenuItems>
                    </Menu>
                </div>
            </div>
        </div>
    );
}
