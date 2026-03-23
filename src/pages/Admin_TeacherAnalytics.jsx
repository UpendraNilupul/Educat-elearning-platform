import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Users, DollarSign, Star, BookOpen, 
    Calendar, Clock, ShieldAlert, Mail 
} from 'lucide-react';

const Admin_TeacherAnalytics = ({ userName, onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/teacher-analytics/${id}`, {
                    credentials: 'include'
                });
                const result = await response.json();
                
                if (result.success) {
                    setData(result);
                } else {
                    alert(result.message);
                    navigate('/admin/teachers');
                }
            } catch (error) {
                console.error("Failed to load analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [id, navigate]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading Teacher Data...</div>;
    if (!data) return null;

    const { profile, kpis, courses, recentReviews } = data;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            {/* Header & Navigation */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
                <button 
                    onClick={() => navigate('/admin/teachers')}
                    className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Directory
                </button>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 flex items-center shadow-sm">
                        <Mail size={16} className="mr-2" /> Message
                    </button>
                    <button className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 flex items-center shadow-sm">
                        <ShieldAlert size={16} className="mr-2" /> Suspend
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* 1. Profile Overview Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 font-black text-4xl shrink-0 overflow-hidden">
                            {profile.picture ? (
                                <img src={`http://localhost:3000/uploads/${profile.picture}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : profile.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <h1 className="text-3xl font-black text-gray-900">{profile.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                    ${profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {profile.status}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium mb-3">{profile.email} • {profile.phone_number}</p>
                            <p className="text-sm font-bold text-[#4a0b59] bg-purple-50 px-3 py-1 rounded-lg inline-block">
                                Subjects: {profile.subjects || 'Unassigned'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-500 font-medium">
                        <p className="flex items-center justify-end mb-2"><Calendar size={16} className="mr-2" /> Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
                        <p className="flex items-center justify-end"><Clock size={16} className="mr-2" /> Last Login: {profile.last_active ? new Date(profile.last_active).toLocaleDateString() : 'Never'}</p>
                    </div>
                </div>

                {/* 2. KPI Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Total Students', value: kpis.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { title: 'Revenue Generated', value: `$${kpis.totalRevenue}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                        { title: 'Average Rating', value: `${kpis.avgRating} / 5`, icon: Star, color: 'text-orange-500', bg: 'bg-orange-100' },
                        { title: 'Active Courses', value: kpis.activeCourses, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Bottom Layout: Courses & Reviews */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Courses Table (Takes up 2/3 width) */}
                    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Course Portfolio</h2>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-bold">Course Title</th>
                                        <th className="p-4 font-bold text-center">Status</th>
                                        <th className="p-4 font-bold text-center">Students</th>
                                        <th className="p-4 font-bold text-right">Revenue</th>
                                        <th className="p-4 font-bold text-center">Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {courses.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">No courses created yet.</td></tr>
                                    ) : (
                                        courses.map((course) => (
                                            <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-bold text-gray-800">{course.title}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                                        ${course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {course.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center font-semibold text-gray-600">{course.total_students}</td>
                                                <td className="p-4 text-right font-bold text-green-600">${parseFloat(course.total_revenue).toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center text-orange-400 font-bold text-sm">
                                                        <Star size={14} className="mr-1 fill-current" />
                                                        {parseFloat(course.average_rating).toFixed(1)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Reviews Feed (Takes up 1/3 width) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Recent Student Reviews</h2>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[400px]">
                            {recentReviews.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No reviews received yet.</p>
                            ) : (
                                recentReviews.map((review, i) => (
                                    <div key={i} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex text-orange-400">
                                                {[...Array(5)].map((_, index) => (
                                                    <Star key={index} size={14} className={index < Math.round(review.rating) ? "fill-current" : "text-gray-200"} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium mb-3">"{review.description}"</p>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            — {review.student_name} <span className="font-normal normal-case ml-1">on {review.course_title}</span>
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Admin_TeacherAnalytics;