import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Search, Filter, MoreVertical, ShieldAlert, 
    Mail, Eye, FileText, CheckCircle, Clock, X, Send, Download, ArrowLeft
} from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Import the API instance

const Admin_Teachers = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const adminId = localStorage.getItem('userId');
    
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

    // Chat Panel States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatUser, setChatUser] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // 🌟 THE FIX: Use api.get()
                const response = await api.get('/admin/subjects');
                const data = response.data;
                if (data.success) setSubjectsList(data.data);
            } catch (error) {
                console.error("Failed to load subjects");
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        const fetchTeachers = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({ search: searchQuery, status: statusFilter, subject: subjectFilter }).toString();
                // 🌟 THE FIX: Use api.get() - no credentials or localhost needed
                const response = await api.get(`/admin/teachers-list?${queryParams}`);
                const data = response.data;
                if (data.success) setTeachers(data.data);
            } catch (error) {
                console.error("Failed to load teachers list");
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => fetchTeachers(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter, subjectFilter]);

    const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        setIsSending(true);

        try {
            // 🌟 THE FIX: Use api.post()
            const response = await api.post('/admin/send-message', {
                senderId: adminId,
                receiverId: chatUser.id,
                message: chatMessage
            });

            const result = response.data;
            if (result.success) {
                setChatMessage('');
                setIsChatOpen(false);
                alert(`Message sent securely to ${chatUser.name}!`);
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const API_BASE = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : 'http://localhost:3000';

    // 🌟 Trigger CSV Download (Keep this as a full URL for window.open)
    const handleExportCSV = () => {
        window.open(`${API_BASE}/api/admin/export/teachers`, '_blank');
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen relative overflow-hidden">
            {/* Header Area */}
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Teacher Directory</h1>
                    <p className="text-gray-500 mt-1">Manage, monitor, and review your platform's educators.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6 items-center">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by code, name, email, or phone..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] text-sm transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="flex items-center space-x-2">
                    <Filter className="text-gray-400" size={18} />
                    <select className="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm font-medium text-gray-700 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">All Active & Pending</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending Review</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>

                <div className="flex items-center space-x-2">
                    <select className="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm font-medium text-gray-700 cursor-pointer" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                        <option value="All">All Subjects</option>
                        {subjectsList.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                    </select>
                </div>

                {/* 🌟 Export Button */}
                <div className="pl-4 border-l border-gray-100">
                    <button 
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-green-50 text-green-700 font-bold text-sm rounded-xl hover:bg-green-100 transition-colors flex items-center border border-green-200"
                    >
                        <Download size={16} className="mr-2" /> Export to CSV
                    </button>
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
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                                                    {teacher.picture ? <img src={`${API_BASE}/uploads/${teacher.picture}`} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : teacher.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        <span className="text-[#4a0b59] mr-1">[{teacher.user_code || 'N/A'}]</span>
                                                        {teacher.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{teacher.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><p className="text-sm text-gray-700 font-medium max-w-[200px] truncate">{teacher.subjects || <span className="text-gray-400 italic">None assigned</span>}</p></td>
                                        <td className="p-4 text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700">{teacher.active_classes}</span></td>
                                        <td className="p-4">
                                            {teacher.account_status === 'suspended' || teacher.account_status === 'banned' ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">{teacher.account_status}</span>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${teacher.verification_status === 'approved' ? 'bg-green-100 text-green-700' : teacher.verification_status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{teacher.verification_status}</span>
                                            )}
                                        </td>
                                        <td className="p-4"><p className="text-xs text-gray-500 font-medium">{teacher.last_active ? new Date(teacher.last_active).toLocaleDateString() : 'Never'}</p></td>
                                        <td className="p-4 text-center relative">
                                            <button onClick={() => toggleMenu(teacher.teacher_id)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === teacher.teacher_id && (
                                                <div className="absolute right-8 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 text-left">
                                                    <Link to={`/admin/teacher-analytics/${teacher.teacher_id}`} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#4a0b59] transition-colors"><Eye size={16} className="mr-2" /> View Analytics</Link>
                                                    
                                                    <Link to={`/admin/review-teacher/${teacher.teacher_id}`} className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"><FileText size={16} className="mr-2" /> Review Application</Link>

                                                    <button 
                                                        onClick={() => {
                                                            setChatUser({ id: teacher.user_id, name: teacher.name, picture: teacher.picture });
                                                            setIsChatOpen(true);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Mail size={16} className="mr-2" /> Message
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

            {/* Slide-Out Chat Drawer */}
            {isChatOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={() => setIsChatOpen(false)}></div>
            )}
            
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0 overflow-hidden">
                            {chatUser?.picture ? <img src={`${API_BASE}/uploads/${chatUser.picture}`} alt="Avatar" className="w-full h-full object-cover" /> : chatUser?.name?.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{chatUser?.name}</h3>
                            <p className="text-xs text-gray-500">Direct Message</p>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-6 bg-white overflow-y-auto">
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm mb-4">
                        <p className="font-bold mb-1 flex items-center"><Clock size={16} className="mr-1.5"/> Auto-Delete Enabled</p>
                        <p className="text-blue-600/80">Messages sent here are highly secure and will automatically self-destruct after 7 days to protect user privacy.</p>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-10">Start a new secure conversation with {chatUser?.name}...</p>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <textarea 
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm"
                        rows="3"
                        placeholder="Type your message here..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim() || isSending}
                            className="px-6 py-2 bg-[#4a0b59] text-white font-bold text-sm rounded-lg hover:bg-purple-900 transition-colors flex items-center shadow-sm disabled:opacity-50"
                        >
                            {isSending ? 'Sending...' : <><Send size={16} className="mr-2" /> Send Message</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Teachers;