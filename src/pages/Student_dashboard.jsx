import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CoursesPage from './Course'; 
import StudentProfileEdit from '../components/StudentProfileEdit';
import DashboardHeader from '../components/DashboardHeader';
import { 
    LayoutDashboard, 
    BookOpen, 
    PlayCircle, 
    FileText, 
    Trophy, 
    Award, 
    Briefcase, 
    Download,
    GraduationCap,
    Calendar,
    ChevronRight,
    Play,
    Settings,
    LogOut,
    X
} from 'lucide-react';

const Student = ({ userName, onLogout }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState('Overview');

    const navItems = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Courses', icon: BookOpen },
        { name: 'Lessons', icon: PlayCircle },
        { name: 'Assessments', icon: FileText },
        { name: 'Challenges', icon: Trophy },
        { name: 'Certification', icon: Award },
        { name: 'Project', icon: Briefcase },
        { name: 'Download', icon: Download },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Educat Dashboard
                    </h2>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                                selectedSection === item.name
                                    ? 'bg-purple-50 text-purple-600 font-semibold shadow-sm ring-1 ring-purple-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setSelectedSection(item.name)}
                        >
                            <item.icon className={`w-5 h-5 ${selectedSection === item.name ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className="text-sm">{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                            {userName?.[0] || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName || 'Student'}</p>
                            <p className="text-xs text-gray-500 truncate">Student Account</p>
                        </div>
                        <Settings className="w-4 h-4 ml-auto text-gray-400 group-hover:text-purple-600" />
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative bg-gray-50">
                <div className="p-8 max-w-6xl mx-auto">
                    <DashboardHeader userName={userName} />
                    
                    {selectedSection === 'Courses' ? (
                        <CoursesPage />
                    ) : (
                        <>
                            <div className="mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                                    Welcome back, {userName || 'Student'}! 👋
                                </h2>
                                <p className="text-gray-500 mt-2 text-lg font-medium max-w-2xl">
                                    Ready to continue your learning journey? You're making great progress this month.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-2.5 bg-purple-50 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase">
                                            +12% Progress
                                        </span>
                                    </div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Course Completion</h3>
                                    <span className="text-3xl font-extrabold text-gray-900">78%</span>
                                    <div className="w-full bg-gray-50 h-2.5 rounded-full mt-6 overflow-hidden border">
                                        <div className="bg-purple-600 h-full transition-all" style={{ width: '78%' }}></div>
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-2.5 bg-blue-50 rounded-xl">
                                            <BookOpen className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Enrollments</h3>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-extrabold text-gray-900">4</span>
                                        <span className="text-gray-500 text-sm font-semibold mb-0.5">Courses</span>
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-2.5 bg-orange-50 rounded-xl">
                                            <Award className="w-6 h-6 text-orange-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Achievement Badges</h3>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-extrabold text-gray-900">12</span>
                                        <span className="text-gray-500 text-sm font-semibold mb-0.5">Badges</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Upcoming Deadlines */}
                                <div className="lg:col-span-1">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Deadlines</h2>
                                    <div className="space-y-4">
                                        {[
                                            { title: 'AI Ethics Quiz', course: 'Artificial Intelligence', date: 'Oct 24', urgent: true },
                                            { title: 'UX Case Study #2', course: 'UI/UX Design', date: 'Oct 26', urgent: false }
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                                                <div className={`p-3 rounded-xl ${item.urgent ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                    <p className="text-xs text-gray-500">{item.course}</p>
                                                    <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md mt-2 inline-block">{item.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Courses */}
                                <div className="lg:col-span-2">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Courses</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                                            <div className="h-32 bg-purple-600"></div>
                                            <div className="p-6">
                                                <h4 className="font-bold text-gray-900 group-hover:text-purple-600">Full Stack Web Development</h4>
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span>Progress</span>
                                                        <span>65%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                        <div className="bg-purple-600 h-full" style={{ width: '65%' }}></div>
                                                    </div>
                                                </div>
                                                <button className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition-all">
                                                    <Play className="w-4 h-4 fill-white" /> Resume
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Profile Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                        <StudentProfileEdit
                            onClose={() => setIsEditModalOpen(false)}
                            initialData={{ fullName: userName || '' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Student;