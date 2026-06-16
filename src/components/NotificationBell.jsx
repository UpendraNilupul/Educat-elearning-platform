import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const userId = localStorage.getItem('userId') || '2'; // Default or logged in user

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        // Handle clicking outside to close dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (userId) {
            const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
            const socket = io(SOCKET_URL);

            socket.emit('join_notification_room', userId);

            socket.on('new_notification', (data) => {
                // Fetch notifications again to get the latest DB state
                fetchNotifications();
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get(`/notifications/${userId}`);
            if (response.data && response.data.success) {
                const fetchedNotifications = response.data.data || [];
                setNotifications(fetchedNotifications);
                const unread = fetchedNotifications.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleBellClick = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark all as read when opened
            try {
                await api.put(`/notifications/${userId}/read`);
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            } catch (error) {
                console.error('Error marking notifications as read:', error);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleBellClick}
                className="relative p-2 text-gray-500 hover:text-brand-purple hover:bg-purple-50 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-semibold text-brand-purple bg-purple-100 px-2 py-1 rounded-full">
                                {unreadCount} New
                            </span>
                        )}
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className={`p-4 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-purple-50/30' : ''}`}>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{notif.title}</h4>
                                        <p className="text-xs text-gray-600 line-clamp-2">{notif.description}</p>
                                        <span className="text-[10px] text-gray-400 mt-2 block">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-semibold text-brand-purple hover:text-purple-700 transition-colors flex items-center justify-center gap-1 w-full cursor-pointer hover:underline"
                            >
                                <Check className="w-3 h-3" /> All caught up
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
