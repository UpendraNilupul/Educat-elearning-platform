import React, { useState } from 'react';
import { 
    LayoutDashboard, BookOpen, Users, CheckSquare, Megaphone, 
    Settings, LogOut, Search, Bell, TrendingUp, UserCheck, PlayCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Dummy Data (Replace with actual fetch calls from your database later) ---
const usageData = [
    { time: '6am', students: 120 }, { time: '9am', students: 450 },
    { time: '12pm', students: 300 }, { time: '3pm', students: 680 },
    { time: '6pm', students: 850 }, { time: '9pm', students: 500 },
];

const Admin = ({ userName, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Sidebar Navigation Items
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'Classes', icon: BookOpen },
        { id: 'teachers', label: 'Teachers', icon: Users },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'review', label: 'To Review', icon: CheckSquare },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            
            {/* ================= SIDEBAR ================= */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10 hidden md:flex">
                <div className="p-6">
                    <h2 className="text-2xl font-black text-[#4a0b59]">Admin <span className="text-[#ed8936]">Panel</span></h2>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-[#4a0b59]/10 text-[#4a0b59] font-bold' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#4a0b59]'
                                }`}
                            >
                                <Icon size={20} className={isActive ? 'text-[#4a0b59]' : ''} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3 mb-6 px-4">
                        <div className="w-10 h-10 rounded-full bg-[#4a0b59] text-white flex items-center justify-center font-bold">
                            {userName ? userName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{userName || 'Admin'}</p>
                            <p className="text-xs text-gray-400">Super Admin</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ================= MAIN CONTENT AREA ================= */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-0">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search students, teachers, or courses..." 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full focus:ring-2 focus:ring-[#4a0b59]/20 outline-none text-sm"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-gray-400 hover:text-[#4a0b59] transition-colors">
                            <Bell size={22} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Overview Dashboard</h1>
                        <p className="text-gray-500 mt-1">Here is what's happening on Educat today.</p>
                    </div>

                    {/* KPI Stat Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { title: 'Total Students', value: '1,240', icon: Users, color: 'bg-blue-100 text-blue-600' },
                            { title: 'Total Teachers', value: '84', icon: UserCheck, color: 'bg-green-100 text-green-600' },
                            { title: 'Active Courses', value: '312', icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
                            { title: 'Monthly Revenue', value: '$12,450', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
                        ].map((stat, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center space-x-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
                                    <stat.icon size={28} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
                                    <h3 className="text-2xl font-black text-gray-800">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts & Highlights Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        
                        {/* Line Chart: Student Usage */}
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Student Activity</h3>
                                    <p className="text-sm text-gray-500">Platform usage throughout the day</p>
                                </div>
                                <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1 outline-none">
                                    <option>Today</option>
                                    <option>This Week</option>
                                </select>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={usageData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} />
                                        <Tooltip cursor={{stroke: '#f3f4f6', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                        <Line type="monotone" dataKey="students" stroke="#4a0b59" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6, fill: '#ed8936', stroke: '#fff'}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Performers</h3>
                            <div className="space-y-6 flex-1">
                                {/* Most Active Teacher */}
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Most Active Teacher</p>
                                    <div className="flex items-center space-x-3">
                                        <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random" alt="Avatar" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-bold text-gray-800">Dr. Sarah Jenkins</p>
                                            <p className="text-xs text-gray-500">24 hrs logged this week</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Top Earning Teacher */}
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Top Earner (Month)</p>
                                    <div className="flex items-center space-x-3">
                                        <img src="https://ui-avatars.com/api/?name=Michael+Chen&background=random" alt="Avatar" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-bold text-gray-800">Michael Chen</p>
                                            <p className="text-xs text-gray-500">$3,450 revenue generated</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Required Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                        
                        {/* New Teachers to Accept */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Pending Teachers</h3>
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">3 New</span>
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">T</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">New Applicant {i+1}</p>
                                                <p className="text-xs text-gray-500">Applied 2 days ago</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="px-3 py-1.5 bg-[#4a0b59] text-white text-xs font-bold rounded-lg hover:bg-purple-900 transition-colors">Accept</button>
                                            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Courses to Review */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Courses to Review</h3>
                                <button className="text-sm text-[#4a0b59] font-semibold hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { title: 'Advanced React Patterns', author: 'Dr. Sarah Jenkins' },
                                    { title: 'Introduction to UI/UX', author: 'Michael Chen' }
                                ].map((course, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-[#4a0b59] flex items-center justify-center">
                                                <PlayCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{course.title}</p>
                                                <p className="text-xs text-gray-500">By {course.author}</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-1.5 border border-[#4a0b59] text-[#4a0b59] text-xs font-bold rounded-lg hover:bg-[#4a0b59] hover:text-white transition-all">
                                            Review
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Admin;