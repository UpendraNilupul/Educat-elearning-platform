import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, MoreVertical, ShieldAlert, 
    PlayCircle, CheckCircle, XCircle, ArrowLeft, Eye
} from 'lucide-react';

const Admin_Courses = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({ search: searchQuery, status: statusFilter }).toString();
                const response = await fetch(`http://localhost:3000/api/admin/courses-list?${queryParams}`, { credentials: 'include' });
                const data = await response.json();
                
                if (data.success) setCourses(data.data);
            } catch (error) {
                console.error("Failed to load courses:", error);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => fetchCourses(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter]);

    const handleUpdateStatus = async (courseId, newStatus) => {
        const actionText = newStatus === 'active' ? 'Approve' : newStatus === 'suspended' ? 'Suspend' : 'Reject';
        if (!window.confirm(`Are you sure you want to ${actionText} this course?`)) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/course-status/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.success) {
                // Instantly update the UI without reloading the page
                setCourses(courses.map(c => c.course_id === courseId ? { ...c, status: newStatus } : c));
                setOpenMenuId(null);
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen">
            
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Course Management</h1>
                    <p className="text-gray-500 mt-1">Review, approve, and track all classes on the platform.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6 items-center">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by course title or teacher..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] text-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Filter className="text-gray-400" size={18} />
                    <select 
                        className="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm font-medium text-gray-700 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Courses</option>
                        <option value="active">Active (Published)</option>
                        <option value="not_active">Pending Review</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] mb-12">
                <div className="overflow-visible w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-bold rounded-tl-2xl">Course Details</th>
                                <th className="p-4 font-bold">Instructor</th>
                                <th className="p-4 font-bold text-center">Students</th>
                                <th className="p-4 font-bold text-right">Revenue</th>
                                <th className="p-4 font-bold text-center">Status</th>
                                <th className="p-4 font-bold text-center rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">Loading courses...</td></tr>
                            ) : courses.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">No courses found matching your filters.</td></tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course.course_id} className="hover:bg-gray-50/50 transition-colors">
                                        
                                        {/* Course Details */}
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                                    <PlayCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{course.title}</p>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{course.type} Format</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Instructor */}
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <img 
                                                    src={course.teacher_picture ? `http://localhost:3000/uploads/${course.teacher_picture}` : `https://ui-avatars.com/api/?name=${course.teacher_name}&background=random`} 
                                                    alt="Avatar" 
                                                    className="w-6 h-6 rounded-full object-cover" 
                                                />
                                                <span className="text-sm font-medium text-gray-700">{course.teacher_name}</span>
                                            </div>
                                        </td>

                                        {/* Students */}
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold">
                                                <Users size={14} className="mr-1.5" />
                                                {course.total_students}
                                            </span>
                                        </td>

                                        {/* Revenue */}
                                        <td className="p-4 text-right">
                                            <span className="text-sm font-black text-green-600">
                                                ${parseFloat(course.total_revenue).toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${course.status === 'active' ? 'bg-green-100 text-green-700' : 
                                                  course.status === 'not_active' ? 'bg-orange-100 text-orange-700' : 
                                                  'bg-red-100 text-red-700'}`}>
                                                {course.status === 'not_active' ? 'Pending Review' : course.status}
                                            </span>
                                        </td>

                                        {/* Action Menu */}
                                        <td className="p-4 text-center relative">
                                            <button 
                                                onClick={() => setOpenMenuId(openMenuId === course.course_id ? null : course.course_id)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === course.course_id && (
                                                <div className="absolute right-8 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 text-left">
                                                    
                                                    {course.status !== 'active' && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(course.course_id, 'active')}
                                                            className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-bold transition-colors"
                                                        >
                                                            <CheckCircle size={16} className="mr-2" /> Approve & Publish
                                                        </button>
                                                    )}

                                                    {course.status === 'active' && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(course.course_id, 'not_active')}
                                                            className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-bold transition-colors"
                                                        >
                                                            <ArrowLeft size={16} className="mr-2" /> Revert to Pending
                                                        </button>
                                                    )}
                                                    
                                                    <div className="my-1 border-t border-gray-100"></div>

                                                    <button 
                                                        onClick={() => handleUpdateStatus(course.course_id, 'suspended')}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <ShieldAlert size={16} className="mr-2" /> Suspend Course
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin_Courses;