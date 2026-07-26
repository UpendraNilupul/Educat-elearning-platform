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

    const markGroupAsRead = async (unreadIds) => {
        try {
            await Promise.all(unreadIds.map(id => api.put(`/notifications/${userId}/read/${id}`)));
            setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - unreadIds.length));
        } catch (error) {
            console.error('Error marking group notifications as read:', error);
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

    // Helper to check if notification is a chat message
    const isMessageNotif = (notif) => {
        const prefix = 'New message from ';
        return notif.title === 'New Message' && notif.description && notif.description.startsWith(prefix);
    };

    // Helper to get sender name from notification
    const getSenderName = (notif) => {
        const prefix = 'New message from ';
        return notif.description.substring(prefix.length);
    };

    // Grouping function
    const groupNotifications = (notifs) => {
        const grouped = [];
        const messageGroups = {}; // Key: senderName

        notifs.forEach(notif => {
            if (isMessageNotif(notif)) {
                const senderName = getSenderName(notif);
                if (messageGroups[senderName]) {
                    const group = messageGroups[senderName];
                    group.ids.push(notif.id);
                    group.totalCount += 1;
                    if (!notif.is_read) {
                        group.unreadCount += 1;
                        group.unreadIds.push(notif.id);
                    }
                } else {
                    const group = {
                        id: `group_${notif.id}`,
                        isGroup: true,
                        senderName,
                        ids: [notif.id],
                        unreadIds: !notif.is_read ? [notif.id] : [],
                        totalCount: 1,
                        unreadCount: !notif.is_read ? 1 : 0,
                        created_at: notif.created_at,
                        is_read: notif.is_read
                    };
                    messageGroups[senderName] = group;
                    grouped.push(group);
                }
            } else {
                grouped.push({
                    ...notif,
                    isGroup: false
                });
            }
        });

        return grouped.map(item => {
            if (item.isGroup) {
                const isRead = item.unreadCount === 0;
                let title = 'New Message';
                let description = '';

                if (item.unreadCount > 0) {
                    title = item.unreadCount > 1 ? 'New Messages' : 'New Message';
                    description = item.unreadCount > 1
                        ? `${item.unreadCount} new messages from ${item.senderName}`
                        : `New message from ${item.senderName}`;
                } else {
                    title = 'Message';
                    description = item.totalCount > 1
                        ? `${item.totalCount} messages from ${item.senderName}`
                        : `Message from ${item.senderName}`;
                }

                return {
                    ...item,
                    is_read: isRead ? 1 : 0,
                    title,
                    description
                };
            }
            return item;
        });
    };

    const processedNotifications = groupNotifications(notifications);
    const filteredNotifications = processedNotifications.filter(n => filter === 'all' ? true : !n.is_read);

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
                                             if (notif.isGroup) {
                                                 if (notif.unreadCount > 0) {
                                                     await markGroupAsRead(notif.unreadIds);
                                                 }
                                                 if (onOpenChat) {
                                                     onOpenChat(notif.senderName);
                                                 }
                                                 setIsOpen(false);
                                             } else {
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
