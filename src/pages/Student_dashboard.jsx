import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CoursesPage from './Course';
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
    LogOut,
    Edit2,
    X
} from 'lucide-react';

import StudentProfileEdit from '../components/StudentProfileEdit';



const Student = ({ userName, onLogout }) => {
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

    const [selectedSection, setSelectedSection] = useState('Overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-gray-100 mb-2">
                    <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-8 h-8 text-orange-500 shrink-0" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Student</span>
                            <span className="text-xl font-medium text-purple-600">Dashboard</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${selectedSection === item.name
                                ? 'bg-purple-50 text-brand-purple font-semibold shadow-sm ring-1 ring-purple-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            onClick={() => setSelectedSection(item.name)}
                        >
                            <item.icon className={`w-5 h-5 ${selectedSection === item.name ? 'text-brand-purple' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className="text-sm">{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3 cursor-pointer hover:bg-gray-100 transition-all duration-200 group/profile border border-transparent hover:border-gray-200 shadow-sm"
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-brand-purple font-bold shrink-0">
                            {userName?.[0] || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover/profile:text-brand-purple transition-colors">{userName || 'Student'}</p>
                            <p className="text-xs text-gray-500 truncate">Student Account</p>
                        </div>
                        <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/profile:opacity-100 transition-opacity ml-auto" />
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
                <div className="pt-8 px-8 pb-8 max-w-6xl mx-auto">

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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-2.5 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform">
                                            <GraduationCap className="w-6 h-6 text-brand-purple" />
                                        </div>
                                        <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            +12% Progress
                                        </span>
                                    </div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Course Completion</h3>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-extrabold text-gray-900 leading-none">78%</span>
                                    </div>
                                    <div className="w-full bg-gray-50 h-2.5 rounded-full mt-6 overflow-hidden border border-gray-100">
                                        <div className="bg-brand-purple h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '78%' }}></div>
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-2.5 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Enrollments</h3>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-extrabold text-gray-900 leading-none">4</span>
                                        <span className="text-gray-500 text-sm font-semibold mb-0.5 ml-1">Courses</span>
                                    </div>
                                    <div className="mt-6 flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                                        <p className="text-xs text-gray-500 font-semibold tracking-tight">2 assignments due this week</p>
                                    </div>
                                </div>

                                <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md group">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="p-2.5 bg-orange-50 rounded-xl group-hover:scale-110 transition-transform">
                                            <Award className="w-6 h-6 text-orange-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Achievement Badges</h3>
                                    <div className="flex items-end gap-2 mt-2">
                                        <span className="text-3xl font-extrabold text-gray-900 leading-none">12</span>
                                        <span className="text-gray-500 text-sm font-semibold mb-0.5 ml-1">Badges</span>
                                    </div>
                                    <div className="flex -space-x-2.5 mt-6">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
                                                <Award className="w-4 h-4 text-orange-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-1">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Upcoming Deadlines</h2>
                                        <button className="text-sm font-semibold text-brand-purple hover:underline">View All</button>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { title: 'AI Ethics Quiz', course: 'Artificial Intelligence', date: 'Oct 24', time: '11:59 PM', urgent: true },
                                            { title: 'UX Case Study #2', course: 'UI/UX Design', date: 'Oct 26', time: '10:00 AM', urgent: false }
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
                                                <div className={`p-3 rounded-xl shrink-0 ${item.urgent ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 group-hover:text-brand-purple transition-colors">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{item.course}</p>
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md uppercase">{item.date}</span>
                                                        <span className="text-[11px] font-bold text-gray-400">{item.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Recent Courses</h2>
                                        <button className="text-sm font-semibold text-brand-purple hover:underline">View My Learning</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { title: 'Full Stack Web Development', instructor: 'Dr. Sarah Jenkins', progress: 65, color: 'purple' },
                                            { title: 'UI/UX Design Masterclass', instructor: 'Michael Chen', progress: 42, color: 'blue' }
                                        ].map((course, idx) => (
                                            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                                                <div className={`h-32 bg-${course.color === 'purple' ? 'purple' : 'blue'}-600`}></div>
                                                <div className="p-6">
                                                    <h4 className="font-bold text-gray-900 group-hover:text-brand-purple transition-colors">{course.title}</h4>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">{course.instructor}</p>
                                                    <div className="mt-6">
                                                        <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100">
                                                            <div className="bg-brand-purple h-full rounded-full transition-all" style={{ width: `${course.progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <button className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-purple transition-all">
                                                        <Play className="w-4 h-4 fill-white" />
                                                        Resume
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md transition-all duration-300 animate-in fade-in">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300">
                        {/* Modal Header/Close */}
                        <div className="sticky top-0 z-10 flex justify-end p-4 bg-white/80 backdrop-blur-md">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-8 pb-10">
                            <StudentProfileEdit
                                onClose={() => setIsEditModalOpen(false)}
                                initialData={{ fullName: userName }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Student;