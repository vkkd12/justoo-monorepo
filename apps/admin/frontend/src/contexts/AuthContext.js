'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await authAPI.getProfile();
            const nextUser = response.data?.data?.user || null;
            setUser(nextUser);
            return nextUser;
        } catch (error) {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const response = await authAPI.login({ username, password });
        console.log(response);
        // After login, backend sets httpOnly cookie. Fetch profile next.
        const me = await checkAuth();
        return { api: response.data, user: me };
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } finally {
            setUser(null);
        }
    };

    const updateUser = (partial) => {
        setUser((prev) => ({ ...(prev || {}), ...(partial || {}) }));
    };

    const value = {
        user,
        login,
        logout,
        loading,
        checkAuth,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
