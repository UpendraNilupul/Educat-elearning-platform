import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Search, Filter, MoreVertical, ShieldAlert, 
    Mail, Eye, FileText, CheckCircle, Clock 
} from 'lucide-react';

const Admin_Teachers = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    
    // Data States
    const [teachers, setTeachers] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [subjectFilter, setSubjectFilter] = useState('All');

    // UI States
    const [openMenuId, setOpenMenuId] = useState(null);

    // 1. Fetch Subjects on Component Mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/admin/subjects');
                const data = await res.json();
                if (data.success) setSubjectsList(data.data);
            } catch (error) {
                console.error("Failed to load subjects");
            }
        };
        fetchSubjects();
    }, []);

    // 2. Fetch Teachers whenever a filter changes!
    useEffect(() => {
        const fetchTeachers = async () => {
            setLoading(true);
            try {
                // Build the query string dynamically
                const queryParams = new URLSearchParams({
                    search: searchQuery,
                    status: statusFilter,
                    subject: subjectFilter
                }).toString();

                const response = await fetch(`http://localhost:3000/api/admin/teachers-list?${queryParams}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    setTeachers(data.data);
                }
            } catch (error) {
                console.error("Failed to load teachers list:", error);
            } finally {
                setLoading(false);
            }
        };

        // Add a small delay (debounce) so we don't spam the server while typing the search
        const delayDebounceFn = setTimeout(() => {
            fetchTeachers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter, subjectFilter]);

    // Helper to close the 3-dot menu if you click somewhere else
    const toggleMenu = (id) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen">
            {/* Header Area */}
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Teacher Directory</h1>
                    <p className="text-gray-500 mt-1">Manage, monitor, and review your platform's educators.</p>
                </div>
                {/* 🌟 THE FIX: Added the Back to Dashboard button */}
                <button 
                    onClick={() => navigate('/admin')}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6 items-center">
                {/* Search */}
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or phone..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] text-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                    <Filter className="text-gray-400" size={18} />
                    <select 
                        className="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm font-medium text-gray-700 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Active & Pending</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending Review</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>

                {/* Subject Filter */}
                <div className="flex items-center space-x-2">
                    <select 
                        className="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm font-medium text-gray-700 cursor-pointer"
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                        <option value="All">All Subjects</option>
                        {subjectsList.map(sub => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] mb-12">
                <div className="overflow-visible w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-bold rounded-tl-2xl">Teacher</th>
                                <th className="p-4 font-bold">Subjects</th>
                                <th className="p-4 font-bold text-center">Active Classes</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Last Login</th>
                                <th className="p-4 font-bold text-center rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">Loading teachers...</td></tr>
                            ) : teachers.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">No teachers found matching your filters.</td></tr>
                            ) : (
                                teachers.map((teacher) => (
                                    <tr key={teacher.teacher_id} className="hover:bg-gray-50/50 transition-colors">
                                        
                                        {/* Teacher Info */}
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                                                    {teacher.picture ? (
                                                        <img src={`http://localhost:3000/uploads/${teacher.picture}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                    ) : teacher.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{teacher.name}</p>
                                                    <p className="text-xs text-gray-500">{teacher.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Subjects (Comma separated by our SQL GROUP_CONCAT) */}
                                        <td className="p-4">
                                            <p className="text-sm text-gray-700 font-medium max-w-[200px] truncate">
                                                {teacher.subjects || <span className="text-gray-400 italic">None assigned</span>}
                                            </p>
                                        </td>

                                        {/* Active Classes */}
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700">
                                                {teacher.active_classes}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="p-4">
                                            {teacher.account_status === 'suspended' || teacher.account_status === 'banned' ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    {teacher.account_status}
                                                </span>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                    ${teacher.verification_status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                      teacher.verification_status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                                                      'bg-gray-100 text-gray-700'}`}>
                                                    {teacher.verification_status}
                                                </span>
                                            )}
                                        </td>

                                        {/* Last Active */}
                                        <td className="p-4">
                                            <p className="text-xs text-gray-500 font-medium">
                                                {teacher.last_active ? new Date(teacher.last_active).toLocaleDateString() : 'Never'}
                                            </p>
                                        </td>

                                        {/* Action Menu */}
                                        <td className="p-4 text-center relative">
                                            <button 
                                                onClick={() => toggleMenu(teacher.teacher_id)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {/* The Dropdown Menu */}
                                            {openMenuId === teacher.teacher_id && (
                                                <div className="absolute right-8 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 text-left">
                                                    
                                                    {/* View Dashboard Analytics */}
                                                    <Link to={`/admin/teacher-analytics/${teacher.teacher_id}`} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#4a0b59] transition-colors">
                                                        <Eye size={16} className="mr-2" /> View Analytics
                                                    </Link>

                                                    {/* Conditional: Review Application */}
                                                    {/*teacher.verification_status != '' && (
                                                        <Link to={`/admin/review-teacher/${teacher.teacher_id}`} className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                                                            <FileText size={16} className="mr-2" /> Review Application
                                                        </Link>
                                                    )*/}
                                                    <Link to={`/admin/review-teacher/${teacher.teacher_id}`} className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                                                        <FileText size={16} className="mr-2" /> Review Application
                                                    </Link>

                                                    {/* Message */}
                                                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        <Mail size={16} className="mr-2" /> Message
                                                    </button>

                                                    <div className="my-1 border-t border-gray-100"></div>

                                                    {/* Security Actions */}
                                                    <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                        <ShieldAlert size={16} className="mr-2" /> Suspend Account
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

export default Admin_Teachers;