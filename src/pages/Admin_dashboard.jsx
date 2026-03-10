import React from 'react';

// 🌟 Accept the props we passed from App.jsx
const Admin = ({ userName, onLogout }) => {
    return (
        <div className="pt-32 p-8 max-w-7xl mx-auto">
            {/* Header row with greeting and logout button */}
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-[#4a0b59]">
                    Welcome back, {userName}! 👋
                </h1>
                
                <button 
                    onClick={onLogout}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                    Logout
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <p className="text-gray-600">Only users with the Admin role can see this page. Here is where your admin widgets will go.</p>
            </div>
        </div>
    );
};

export default Admin;