import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    Play, 
    Clock, 
    BookOpen, 
    Star,
    MoreVertical,
    CheckCircle
} from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Imported API ready for backend connection!

const CoursesPage = () => {
    const navigate = useNavigate();
    
    // UI States
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeTab, setActiveTab] = useState('In Progress');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // 🌟 THE FIX: Moved courses to State so it can be updated by the backend
    const [courses, setCourses] = useState([
        {
            id: 1,
            title: 'Full Stack Web Development',
            instructor: 'Dr. Sarah Jenkins',
            progress: 65,
            modulesCompleted: 14,
            totalModules: 22,
            totalHours: 32,
            rating: 4.8,
            status: 'In Progress',
            color: 'purple',
            thumbnail: 'bg-gradient-to-br from-purple-500 to-indigo-600'
        },
        {
            id: 2,
            title: 'UI/UX Design Masterclass',
            instructor: 'Michael Chen',
            progress: 42,
            modulesCompleted: 8,
            totalModules: 19,
            totalHours: 24,
            rating: 4.9,
            status: 'In Progress',
            color: 'blue',
            thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500'
        },
        {
            id: 3,
            title: 'Advanced Database Systems',
            instructor: 'Prof. Alan Turing',
            progress: 100,
            modulesCompleted: 12,
            totalModules: 12,
            totalHours: 18,
            rating: 4.7,
            status: 'Completed',
            color: 'green',
            thumbnail: 'bg-gradient-to-br from-emerald-400 to-teal-500'
        },
        {
            id: 4,
            title: 'Machine Learning Basics',
            instructor: 'Dr. Andrew Ng',
            progress: 0,
            modulesCompleted: 0,
            totalModules: 28,
            totalHours: 45,
            rating: 4.9,
            status: 'Not Started',
            color: 'orange',
            thumbnail: 'bg-gradient-to-br from-orange-400 to-red-500'
        }
    ]);

    // 🌟 THE FIX: Built the API connector for when your backend is ready
    useEffect(() => {
        const fetchMyCourses = async () => {
            // setLoading(true);
            try {
                // UNCOMMENT THIS WHEN BACKEND IS READY:
                // const response = await api.get('/student/my-courses-progress');
                // if (response.data.success) setCourses(response.data.data);
            } catch (error) {
                console.error("Failed to load courses:", error);
            } finally {
                // setLoading(false);
            }
        };

        fetchMyCourses();
    }, []);

    let filteredCourses = courses;
    
    if (filterStatus !== 'All') {
        filteredCourses = filteredCourses.filter(c => c.status === filterStatus);
    } else if (activeTab !== 'All') {
        filteredCourses = filteredCourses.filter(c => c.status === activeTab);
    }
    
    if (searchTerm.trim() !== '') {
        filteredCourses = filteredCourses.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-brand-purple font-bold">Loading your courses...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">My Courses</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Manage and track your learning progress.</p>
                </div>
                <div>
                    <button
                        onClick={() => navigate('/student')}
                        className="mt-4 px-4 py-2 bg-brand-purple text-white rounded-lg font-bold hover:bg-purple-700 transition-all"
                    >
                        Go to Student Dashboard
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-brand-purple transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search courses..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-brand-purple transition-all w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <button className="relative p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-brand-purple hover:border-purple-200 hover:bg-purple-50 transition-all shadow-sm">
                        <Filter className="w-4 h-4" onClick={() => setShowFilter(!showFilter)} />
                        {showFilter && (
                            <div className="absolute z-10 mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-48 text-left">
                                <div className="mb-2 font-bold text-gray-700">Filter by Status</div>
                                {['All', 'In Progress', 'Completed', 'Not Started'].map(status => (
                                    <button
                                        key={status}
                                        className={`block w-full text-left px-3 py-2 rounded-lg mb-1 font-medium ${filterStatus === status ? 'bg-purple-50 text-brand-purple' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => { setFilterStatus(status); setShowFilter(false); }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
                {['All', 'In Progress', 'Completed'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-sm font-bold transition-all relative ${
                            activeTab === tab 
                                ? 'text-brand-purple' 
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-purple rounded-t-full"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                        
                        {/* Course Thumbnail */}
                        <div className={`h-40 ${course.thumbnail} relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                            
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                {course.progress === 100 ? (
                                    <><CheckCircle className="w-3 h-3" /> Completed</>
                                ) : (
                                    <><Clock className="w-3 h-3" /> {course.status}</>
                                )}
                            </div>

                            <button className="absolute top-4 left-4 p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Course Info */}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <h4 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-brand-purple transition-colors leading-tight">
                                    {course.title}
                                </h4>
                            </div>
                            
                            <p className="text-xs text-gray-500 font-medium mb-4">{course.instructor}</p>
                            
                            {/* Course Meta Info */}
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-6">
                                <div className="flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{course.totalModules} Modules</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    <span>{course.rating}</span>
                                </div>
                            </div>
                            
                            {/* Progress Section */}
                            <div className="mt-auto">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                                    <span className="text-xs font-extrabold text-gray-900">{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-gray-100 p-[1px]">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm
                                            ${course.progress === 100 ? 'bg-emerald-500' : 'bg-brand-purple'}`} 
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">
                                    {course.modulesCompleted} / {course.totalModules} Completed
                                </p>
                            </div>

                            {/* Action Button */}
                            <button className={`w-full mt-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95
                                ${course.progress === 100 
                                    ? 'bg-gray-50 text-gray-700 hover:bg-gray-100' 
                                    : 'bg-gray-900 text-white hover:bg-brand-purple hover:shadow-md'}`}
                            >
                                {course.progress === 100 ? (
                                    'Review Course'
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 fill-current" />
                                        {course.progress === 0 ? 'Start Course' : 'Resume Course'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoursesPage;