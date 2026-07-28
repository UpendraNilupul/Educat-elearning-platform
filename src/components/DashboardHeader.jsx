import React from 'react';
import NotificationBell from './NotificationBell';

const DashboardHeader = ({ userName, onOpenChat }) => {
    return (
        <header className="mb-8 bg-transparent flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
            <NotificationBell onOpenChat={onOpenChat} />
        </header>
    );
};

export default DashboardHeader;
