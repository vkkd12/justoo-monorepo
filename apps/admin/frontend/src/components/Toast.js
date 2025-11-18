'use client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Toast({ type = 'success', message, onClose }) {
    useEffect(() => {
        if (!message) return;

        if (type === 'error') {
            toast.error(message);
        } else {
            toast.success(message);
        }

        if (onClose) {
            const timer = setTimeout(onClose, 3000); // Auto-close after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [type, message]); // Removed onClose from dependencies

    return null;
}
