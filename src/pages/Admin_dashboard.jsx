import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, BookOpen, Users, CheckSquare, Megaphone, 
    Settings, LogOut, Search, Bell, TrendingUp, UserCheck, PlayCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Admin = ({ userName, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch dynamic database stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/admin/dashboard-stats', {
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'Classes', icon: BookOpen },
        { id: 'teachers', label: 'Teachers', icon: Users },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'review', label: 'To Review', icon: CheckSquare },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50">Loading Dashboard...</div>;
    }

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
                            { title: 'Total Students', value: stats?.kpis.totalStudents || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
                            { title: 'Verified Teachers', value: stats?.kpis.totalTeachers || 0, icon: UserCheck, color: 'bg-green-100 text-green-600' },
                            { title: 'Active Classes', value: stats?.kpis.activeCourses || 0, icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
                            { title: 'Monthly Revenue', value: `$${stats?.kpis.monthlyRevenue || 0}`, icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
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
                                    <p className="text-sm text-gray-500">Platform logins today</p>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats?.usageData || []}>
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
                                {stats?.mostActiveTeacher ? (
                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Most Active Teacher</p>
                                        <div className="flex items-center space-x-3">
                                            <img src={stats.mostActiveTeacher.picture || "https://ui-avatars.com/api/?name=Teacher&background=random"} alt="Avatar" className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-bold text-gray-800">{stats.mostActiveTeacher.name}</p>
                                                <p className="text-xs text-gray-500">{stats.mostActiveTeacher.course_count} courses created</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No teacher activity recorded yet.</p>
                                )}
                                
                                {/* Top Earning Teacher */}
                                {stats?.topEarner ? (
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Top Earner (Month)</p>
                                        <div className="flex items-center space-x-3">
                                            <img src={stats.topEarner.picture || "https://ui-avatars.com/api/?name=Earner&background=random"} alt="Avatar" className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="font-bold text-gray-800">{stats.topEarner.name}</p>
                                                <p className="text-xs text-gray-500">${stats.topEarner.total_earned} revenue generated</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No revenue recorded this month.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Required Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                        
                        {/* New Teachers to Accept */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Pending Teachers</h3>
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">{stats?.pendingTeachers.length || 0} New</span>
                            </div>
                            <div className="space-y-4">
                                {stats?.pendingTeachers.length > 0 ? (
                                    stats.pendingTeachers.map((teacher, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                    {teacher.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{teacher.name}</p>
                                                    <p className="text-xs text-gray-500">{teacher.highest_qualification || 'Qualifications pending'}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className="px-3 py-1.5 bg-[#4a0b59] text-white text-xs font-bold rounded-lg hover:bg-purple-900 transition-colors">Review</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No pending teacher applications.</p>
                                )}
                            </div>
                        </div>

                        {/* Courses to Review */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Courses to Review</h3>
                                <button className="text-sm text-[#4a0b59] font-semibold hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {stats?.coursesToReview.length > 0 ? (
                                    stats.coursesToReview.map((course, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
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
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No new courses require review.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Admin;