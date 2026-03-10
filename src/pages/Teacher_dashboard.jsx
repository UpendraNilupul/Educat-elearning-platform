import React from 'react';

const Teacher = ({ userName, onLogout }) => {
    return (
        <div className="pt-32 p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header row with greeting and logout button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#4a0b59]">
                        Welcome back, Professor {userName}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Teacher Portal</p>
                </div>
                
                <button 
                    onClick={onLogout}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                    Logout
                </button>
            </div>

            {/* Dashboard Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">My Classes</h3>
                    <p className="text-gray-600">Manage your course materials and schedules.</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Student Progress</h3>
                    <p className="text-gray-600">View grades, attendance, and performance.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Assignments</h3>
                    <p className="text-gray-600">Create and grade student submissions.</p>
                </div>
            </div>
        </div>
    );
};

export default Teacher;