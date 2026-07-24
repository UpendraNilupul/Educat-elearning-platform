import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Circle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api';

const NotificationBell = ({ onOpenChat }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'
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

    const handleBellClick = () => {
        setIsOpen(!isOpen);
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${userId}/read/${notificationId}`);
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put(`/notifications/${userId}/read`);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' ? true : !n.is_read);

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

                    <div className="px-4 py-2 flex gap-2 border-b border-gray-100">
                        <button 
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'all' ? 'bg-gray-200 text-gray-800 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === 'unread' ? 'bg-brand-purple text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread
                        </button>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                No notifications found.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredNotifications.map((notif) => (
                                     <div 
                                         key={notif.id} 
                                         onClick={async () => {
                                             if (!notif.is_read) {
                                                 await markAsRead(notif.id);
                                             }
                                             const prefix = 'New message from ';
                                             if (notif.title === 'New Message' && notif.description.startsWith(prefix)) {
                                                 const senderName = notif.description.substring(prefix.length);
                                                 if (onOpenChat) {
                                                     onOpenChat(senderName);
                                                 }
                                                 setIsOpen(false);
                                             }
                                         }}
                                         className={`p-4 transition-colors hover:bg-gray-50 flex gap-3 cursor-pointer ${!notif.is_read ? 'bg-purple-50/30' : ''}`}
                                     >
                                        <div className="mt-1 flex-shrink-0">
                                            {!notif.is_read && <div className="w-2.5 h-2.5 bg-black rounded-full" title="Unread"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-sm mb-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{notif.title}</h4>
                                            <p className="text-xs text-gray-600 line-clamp-2">{notif.description}</p>
                                            <span className="text-[10px] text-gray-400 mt-2 block">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 0 && unreadCount > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-brand-purple hover:text-purple-700 transition-colors flex items-center justify-center gap-1 w-full cursor-pointer hover:underline"
                            >
                                <Check className="w-3 h-3" /> Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
