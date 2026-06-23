import React from 'react';
import NotificationBell from './NotificationBell';

const DashboardHeader = ({ userName }) => {
    return (
        <header className="mb-8 bg-transparent flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
            <NotificationBell />
        </header>
    );
};

export default DashboardHeader;
