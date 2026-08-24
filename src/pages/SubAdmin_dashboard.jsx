import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, BookOpen, Users, CheckSquare, Megaphone,
    Settings, LogOut, Bell, UserCheck, PlayCircle, ShieldAlert, Send, X, MessageSquare, DollarSign, TrendingUp, CreditCard, Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; 
import { io } from 'socket.io-client';
import NotificationBell from '../components/NotificationBell';

// 🌟 THE FIX: 'adminLevel' is now correctly received as a prop!
const SubAdmin_dashboard = ({ userName, adminLevel, onLogout }) => {
    const navigate = useNavigate();

    // 🚨 We removed the localStorage line here. The component now strictly listens to App.jsx for security.

    const [stats, setStats] = useState(null);
    const [financeStats, setFinanceStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // Escalation Modal
    const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
    const [escalationData, setEscalationData] = useState({ entityType: 'teacher', entityId: '', reason: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Real-time Chat Notifications
    const fetchUnreadMessagesCount = async () => {
        try {
            const response = await api.get('/chat/unread-count');
            if (response.data && response.data.success) setUnreadMessagesCount(response.data.count);
        } catch (error) {}
    };

    useEffect(() => {
        fetchUnreadMessagesCount();
        const userId = localStorage.getItem('userId');
        window.addEventListener('chat_messages_read', fetchUnreadMessagesCount);

        if (userId) {
            const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
            const socket = io(SOCKET_URL);
            socket.emit('join_notification_room', userId);
            socket.on('new_notification', () => fetchUnreadMessagesCount());
            return () => { socket.disconnect(); window.removeEventListener('chat_messages_read', fetchUnreadMessagesCount); };
        }
        return () => window.removeEventListener('chat_messages_read', fetchUnreadMessagesCount);
    }, []);

    // Fetch Appropriate Data based on Role
    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (adminLevel === 'finance') {
                    // Fetch financial specific stats (Pending Slips & Payouts)
                    const slipRes = await api.get('/admin/pending-payments');
                    const payoutRes = await api.get(`/admin/payouts`);
                    
                    setFinanceStats({
                        pendingSlips: slipRes.data.data.length || 0,
                        totalPayouts: payoutRes.data.stats?.totalToPay || 0,
                        systemEarnings: payoutRes.data.stats?.systemEarnings || 0
                    });
                } else {
                    // Standard Moderator Stats
                    const response = await api.get(`/admin/dashboard-stats`);
                    if (response.data.success) setStats(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch sub-admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [adminLevel]);

    const handleEscalationSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post('/admin/escalate', escalationData);
            if (response.data.success) {
                alert("Issue successfully escalated to the Super Admin.");
                setIsEscalateModalOpen(false);
                setEscalationData({ entityType: 'teacher', entityId: '', reason: '' });
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to submit escalation.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🌟 DYNAMIC NAVIGATION ITEMS
    const moderatorNav = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { id: 'courses', label: 'Review Classes', icon: BookOpen, path: '/admin/courses' },
        { id: 'teachers', label: 'Teacher Directory', icon: Users, path: '/admin/teachers' },
        { id: 'students', label: 'Student Directory', icon: Users, path: '/admin/students' },
        { id: 'promo', label: 'Promo Codes', icon: Megaphone, path: '/admin/promos' },
        { id: 'communications', label: 'Communications', icon: MessageSquare, path: '/admin/communications' },
        { id: 'settings', label: 'My Settings', icon: Settings, path: '/admin/settings' },
    ];

    const financeNav = [
        { id: 'dashboard', label: 'Finance Hub', icon: LayoutDashboard, path: '/admin' },
        { id: 'slips', label: 'Slip Approvals', icon: CheckSquare, path: '/admin/slips' },
        { id: 'payouts', label: 'Teacher Payouts', icon: CreditCard, path: '/admin/payouts' },
        { id: 'communications', label: 'Messages', icon: MessageSquare, path: '/admin/communications' },
        { id: 'settings', label: 'My Settings', icon: Settings, path: '/admin/settings' },
    ];

    const navItems = adminLevel === 'finance' ? financeNav : moderatorNav;

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 font-bold text-gray-500">Loading your workspace...</div>;

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            
            {/* ================= SIDEBAR ================= */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm z-10 hidden md:flex">
                <div className="p-6">
                    <h2 className={`text-2xl font-black ${adminLevel === 'finance' ? 'text-green-600' : 'text-blue-600'}`}>
                        {adminLevel === 'finance' ? 'Finance' : 'Moderator'} <span className="text-gray-900">Hub</span>
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.id === 'dashboard';
                        const themeColor = adminLevel === 'finance' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50';
                        const hoverColor = adminLevel === 'finance' ? 'hover:text-green-600' : 'hover:text-blue-600';

                        return (
                            <Link key={item.id} to={item.path} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? `${themeColor} font-bold` : `text-gray-500 hover:bg-gray-50 ${hoverColor}`}`}>
                                <Icon size={20} className={isActive ? (adminLevel === 'finance' ? 'text-green-600' : 'text-blue-600') : ''} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.id === 'communications' && unreadMessagesCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                                        {unreadMessagesCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3 mb-6 px-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${adminLevel === 'finance' ? 'bg-green-600' : 'bg-blue-600'}`}>
                            {userName ? userName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 truncate">{userName || 'Staff'}</p>
                            <p className="text-xs text-gray-400 capitalize">{adminLevel === 'finance' ? 'Financial Manager' : 'Moderator'}</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ================= MAIN CONTENT AREA ================= */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-0">
                    <h1 className="text-2xl font-bold text-gray-800">Overview Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setIsEscalateModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors mr-2 text-sm"
                        >
                            <ShieldAlert size={16} className="mr-2" /> Escalate Issue
                        </button>
                        <NotificationBell onOpenChat={(senderName) => navigate('/admin/communications', { state: { autoOpenSenderName: senderName } })} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    
                    {/* 🌟 CONDITIONAL DASHBOARDS BASED ON ROLE */}

                    {adminLevel === 'finance' ? (
                        /* ================= FINANCIAL MANAGER DASHBOARD ================= */
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6"><h2 className="text-xl font-bold text-gray-800 border-l-4 border-green-500 pl-3">This Month's Financials</h2></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600"><CheckSquare size={28} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-bold mb-1 uppercase tracking-wider">Pending Slips</p>
                                        <h3 className="text-2xl font-black text-gray-800">{financeStats?.pendingSlips || 0} Awaiting</h3>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600"><DollarSign size={28} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-bold mb-1 uppercase tracking-wider">System Earnings (10%)</p>
                                        <h3 className="text-2xl font-black text-gray-800">Rs. {financeStats?.systemEarnings?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                                <div className="bg-green-600 rounded-3xl p-6 shadow-md flex items-center space-x-4 text-white">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20"><CreditCard size={28} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-green-100 mb-1 uppercase tracking-wider">Total Teacher Payouts</p>
                                        <h3 className="text-2xl font-black">Rs. {financeStats?.totalPayouts?.toFixed(2) || '0.00'}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
                                    <CheckSquare size={48} className="text-blue-200 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Review Bank Slips</h3>
                                    <p className="text-gray-500 mb-6 text-sm max-w-sm">Students have uploaded manual bank transfer slips. Review the images against the bank statement and approve their access.</p>
                                    <button onClick={() => navigate('/admin/slips')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm w-full md:w-auto">Open Approvals Queue</button>
                                </div>
                                
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
                                    <CreditCard size={48} className="text-green-200 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Process Payouts</h3>
                                    <p className="text-gray-500 mb-6 text-sm max-w-sm">Calculate platform fees, adjust balances, process physical transfers, and mark teachers as Paid in the system ledger.</p>
                                    <button onClick={() => navigate('/admin/payouts')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-sm w-full md:w-auto">Open Financial Ledger</button>
                                </div>
                            </div>
                        </div>

                    ) : (

                        /* ================= SYSTEM MODERATOR DASHBOARD ================= */
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-600"><Users size={28} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium mb-1">Total Students</p>
                                        <h3 className="text-2xl font-black text-gray-800">{stats?.kpis.totalStudents || 0}</h3>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-100 text-green-600"><UserCheck size={28} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium mb-1">Verified Teachers</p>
                                        <h3 className="text-2xl font-black text-gray-800">{stats?.kpis.totalTeachers || 0}</h3>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-100 text-purple-600"><BookOpen size={28} /></div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium mb-1">Active Classes</p>
                                        <h3 className="text-2xl font-black text-gray-800">{stats?.kpis.activeCourses || 0}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                                {/* Pending Teachers */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-800">Applications to Review</h3>
                                        <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">{stats?.pendingTeachers.length || 0} Pending</span>
                                    </div>
                                    <div className="space-y-4">
                                        {stats?.pendingTeachers.length > 0 ? (
                                            stats.pendingTeachers.map((teacher, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{teacher.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{teacher.name}</p>
                                                            <p className="text-xs text-gray-500">{teacher.highest_qualification || 'Qualifications pending'}</p>
                                                        </div>
                                                    </div>
                                                    <Link to={`/admin/review-teacher/${teacher.id}`} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">Review</Link>
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
                                        <button onClick={() => navigate('/admin/courses')} className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
                                    </div>
                                    <div className="space-y-4">
                                        {stats?.coursesToReview.length > 0 ? (
                                            stats.coursesToReview.map((course, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><PlayCircle size={20} /></div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800">{course.title}</p>
                                                            <p className="text-xs text-gray-500">By {course.author}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => navigate('/admin/courses')} className="px-4 py-1.5 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all">Review</button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-4">No new courses require review.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ================= ESCALATION MODAL ================= */}
            {isEscalateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50 text-red-600">
                            <h2 className="text-xl font-bold flex items-center"><ShieldAlert className="mr-2" /> Escalate to Super Admin</h2>
                            <button onClick={() => setIsEscalateModalOpen(false)} className="text-red-400 hover:text-red-700 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleEscalationSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 mb-2">If a situation requires Super Admin clearance (e.g., severe policy violation, high-level ban), submit a report here.</p>
                            
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entity Type</label>
                                    <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold" value={escalationData.entityType} onChange={(e) => setEscalationData({...escalationData, entityType: e.target.value})}>
                                        <option value="teacher">Teacher</option>
                                        <option value="student">Student</option>
                                        <option value="course">Course</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entity ID</label>
                                    <input type="number" required placeholder="e.g. 15" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 text-sm font-bold" value={escalationData.entityId} onChange={(e) => setEscalationData({...escalationData, entityId: e.target.value})} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Escalation</label>
                                <textarea required rows="4" placeholder="Provide details on why this requires Super Admin intervention..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 resize-none text-sm" value={escalationData.reason} onChange={(e) => setEscalationData({...escalationData, reason: e.target.value})}></textarea>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 flex items-center shadow-md transition-all disabled:opacity-50">
                                    {isSubmitting ? 'Sending...' : <><Send size={16} className="mr-2" /> Send Report</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubAdmin_dashboard;