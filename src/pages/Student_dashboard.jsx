// Force Vite HMR reload
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CoursesPage from './Course';
import AssessmentsPage from './AssessmentsPage';
import StudentProfileEdit from '../components/StudentProfileEdit';
import TuitionClass from './Class';
import StudentCalendar from '../components/StudentCalendar';
import DashboardHeader from '../components/DashboardHeader';
import StudentChat from './Student_Chat';
import api from '../api'; // 🌟 THE FIX: Import the API instance

import {
    LayoutDashboard, BookOpen, PlayCircle, FileText, Trophy, Award, Briefcase,
    Download, Settings, LogOut, GraduationCap, Calendar, Play, X, ChevronRight,
    Edit2, Search, SearchX, Loader2, MessageSquare
} from 'lucide-react';

const Student = ({ userName, onLogout }) => {
    const [selectedSection, setSelectedSection] = useState('Overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [profileData, setProfileData] = useState({ name: '', picture: '' });
    const [firstName, setFirstName] = useState('Student');
    const [pendingAssessmentsCount, setPendingAssessmentsCount] = useState(0);
    const navigate = useNavigate();

    // Search-related state (ඔයාගේ යාලුවා හදපු ටික)
    const [filters, setFilters] = useState({ teacher: '', className: '', subject: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Dashboard Data
    const [recentCourses, setRecentCourses] = useState([]);
    const [recentClasses, setRecentClasses] = useState([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setIsSearching(true);
        setHasSearched(true);
        try {
            const params = new URLSearchParams(filters);
            // 🌟 THE FIX: Use api.get()
            const response = await api.get(`/courses/search?${params.toString()}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error during course search:', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const fetchBasicInfo = async () => {
            const userId = localStorage.getItem('userId') || '2';
            try {
                // 🌟 THE FIX: Use api.get()
                const response = await api.get(`/student/basic-info/${userId}`);
                const result = response.data;

                if (result.success) {
                    let picUrl = result.picture;
                    if (picUrl && !picUrl.startsWith('http')) {
                        // 🌟 THE FIX: Dynamically set the image base URL for local vs production
                        const baseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
                        picUrl = `${baseURL}/uploads/${picUrl}`;
                    }
                    setProfileData({ name: result.name, picture: picUrl });
                    if (result.name) setFirstName(result.name.split(' ')[0]);
                }
            } catch (error) {
                console.error("Error fetching basic dashboard info:", error);
            }
        };

        const fetchAssessmentsCount = async () => {
            try {
                const response = await api.get(`/student/my-assessments`);
                const pendingCount = response.data.filter(a => {
                    const isPublished = !a.publish_at || new Date(a.publish_at) <= new Date();
                    return a.status === 'pending' && isPublished;
                }).length;
                setPendingAssessmentsCount(pendingCount);
            } catch (error) {
                console.error("Error fetching assessments count:", error);
            }
        };

        fetchBasicInfo();
        fetchAssessmentsCount();
    }, []);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await api.get(`/suggested-classes`);
                if (Array.isArray(response.data)) {
                    setRecentClasses(response.data);
                } else {
                    console.error("Expected array for recent classes, got:", response.data);
                    setRecentClasses([]);
                }
            } catch (error) {
                console.error("Error fetching recent classes:", error);
                setRecentClasses([]);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Replace '1' with the actual logged-in student ID from your auth context
                const userId = localStorage.getItem('userId') || '1';
                const response = await api.get(`/student/dashboard/${userId}`);
                setRecentCourses(response.data.courses);
                setUpcomingDeadlines(response.data.deadlines);
                setLoadingDashboard(false);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setLoadingDashboard(false);
            }
        };
        fetchDashboardData();
    }, []);

    const ads = ['/add1.png', '/add2.png', '/add3.png', '/add4.png'];
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentAdIndex((prevIndex) => (prevIndex === ads.length - 1 ? 0 : prevIndex + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [ads.length]);

    // 🌟 ADDED MESSAGES TO NAV ITEMS
    const navItems = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Calendar', icon: Calendar },
        { name: 'Lessons', label: 'Classes', icon: BookOpen },
        { name: 'Assessments', icon: FileText, hasBadge: pendingAssessmentsCount > 0 },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-52 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="px-4 py-5 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Student</span>
                            <span className="text-xl font-medium text-purple-400">Dashboard</span>
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
                            onClick={() => {
                                setSelectedSection(item.name);
                            }}
                        >
                            <item.icon className={`w-5 h-5 ${selectedSection === item.name ? 'text-brand-purple' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className="text-sm flex-1 text-left">{item.label || item.name}</span>
                            {item.hasBadge && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-3 cursor-pointer hover:bg-gray-200 transition-colors duration-200 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-brand-purple font-bold group-hover:bg-purple-200 transition-colors overflow-hidden">
                            {profileData.picture ? (
                                <img src={profileData.picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                profileData.name?.charAt(0) || userName?.[0] || 'S'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{profileData.name || userName || 'Student'}</h4>
                            <p className="text-xs text-gray-500 truncate">Student Account</p>
                        </div>
                        <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-brand-purple transition-colors ml-auto" />
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
                    ) : selectedSection === 'Assessments' ? (
                        <AssessmentsPage />
                    ) : selectedSection === 'Lessons' ? (
                        <TuitionClass />
                    ) : selectedSection === 'Calendar' ? (
                        <StudentCalendar studentId={1} />
                    ) : selectedSection === 'Messages' ? (
                        <StudentChat />
                    ) : (
                        <>
                            {/* Welcome Section */}
                            <div className="pt-6 mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                                    Welcome back, {firstName}! 👋
                                </h2>
                                <p className="text-gray-500 mt-2 text-lg font-medium max-w-2xl">
                                    Ready to continue your learning journey? You're making great progress this month.
                                </p>
                            </div>

                            {/* Advertisement Slideshow */}
                            {(() => {
                                const visibleAds = [
                                    ads[currentAdIndex % ads.length],
                                    ads[(currentAdIndex + 1) % ads.length],
                                    ads[(currentAdIndex + 2) % ads.length]
                                ];
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
                                        {visibleAds.map((ad, index) => (
                                            <div key={index} className="w-full h-[200px] relative overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
                                                <img
                                                    src={ad}
                                                    alt={`Ad ${index + 1}`}
                                                    className="w-full h-full object-contain transition-opacity duration-700 ease-in-out"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Horizontal Search Filter Bar */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Teacher</label>
                                        <input
                                            type="text"
                                            placeholder="Search by teacher name..."
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all text-sm"
                                            value={filters.teacher}
                                            onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Class Name</label>
                                        <input
                                            type="text"
                                            placeholder="Search by class name..."
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all text-sm"
                                            value={filters.className}
                                            onChange={(e) => setFilters({ ...filters, className: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                                        <input
                                            type="text"
                                            placeholder="Search by subject..."
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all text-sm"
                                            value={filters.subject}
                                            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearching}
                                        className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px] text-base"
                                    >
                                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                        Search Courses
                                    </button>
                                </form>
                            </div>

                            {/* Search Results Area */}
                            {hasSearched && (
                                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Found Courses ({searchResults.length})</h2>
                                        <button
                                            onClick={() => { setHasSearched(false); setFilters({ teacher: '', className: '', subject: '' }); }}
                                            className="text-sm font-semibold text-gray-500 hover:text-red-500 flex items-center gap-1"
                                        >
                                            <X className="w-4 h-4" /> Clear Results
                                        </button>
                                    </div>

                                    {searchResults.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {searchResults.map((course) => (
                                                <div key={course.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`p-2 rounded-xl bg-${course.theme_color || 'purple'}-600/10 group-hover:scale-110 transition-transform`}>
                                                            <BookOpen className={`w-5 h-5 text-${course.theme_color || 'purple'}-600`} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                            {course.type}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-brand-purple transition-colors">{course.class_name}</h4>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">Instructor: {course.teacher_name}</p>
                                                    <p className="text-[11px] text-gray-400 font-bold mt-4 uppercase tracking-widest">{course.subject}</p>

                                                    <button className="w-full mt-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-purple transition-all active:scale-95">
                                                        View Details
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                                <SearchX className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <h3 className="text-gray-900 font-bold text-lg">No courses found</h3>
                                            <p className="text-gray-500 text-sm mt-1 max-w-xs">We couldn't find any courses matching your criteria. Try different keywords or filters.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Suggested Classes */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-950">Suggested Classes for You</h3>
                                    <button 
                                        onClick={() => setSelectedSection('Lessons')}
                                        className="text-sm font-semibold text-brand-purple hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loadingDashboard && (!Array.isArray(recentClasses) || recentClasses.length === 0) ? (
                                        <div className="col-span-full flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-brand-purple" /></div>
                                    ) : (!Array.isArray(recentClasses) || recentClasses.length === 0) ? (
                                        <p className="col-span-full text-sm text-gray-500 p-4 text-center">No suggested classes found.</p>
                                    ) : (
                                        recentClasses.map((cls) => (
                                            <div key={cls.id} className="relative flex flex-col overflow-hidden transition-all bg-white border border-orange-100 shadow-sm rounded-2xl hover:shadow-lg group">
                                                <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">New</div>
                                                <div className="flex items-center gap-4 p-6 border-b border-gray-50 bg-gradient-to-r from-orange-50/50 to-white">
                                                    <img src={cls.teacher?.image} alt={cls.teacher?.name} className="object-cover w-16 h-16 shadow-sm rounded-xl" />
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher?.name || cls.teacher_name}</h3>
                                                        <p className="mt-1 text-xs font-semibold text-gray-500">{cls.grade}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col flex-1 p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h2 className="text-xl font-black text-gray-900 transition-colors group-hover:text-orange-600">{cls.subject}</h2>
                                                    </div>

                                                    <button
                                                        onClick={() => setSelectedSection('Lessons')}
                                                        className="w-full mt-auto py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm bg-gray-900 text-white hover:bg-orange-600"
                                                    >
                                                        Enter Portal
                                                    </button>
                                                </div>
                                            </div>
                                        )))}
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
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors bg-white z-10"
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