import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Search, Filter, MoreVertical, ShieldAlert, 
    Mail, Eye, X, Megaphone, Gift, Clock, Send 
} from 'lucide-react';

const Admin_Students = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const adminId = localStorage.getItem('userId'); // 🌟 Get Admin's ID for the chat
    
    // Data States
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // UI States
    const [openMenuId, setOpenMenuId] = useState(null);
    
    // Bulk Action States
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkType, setBulkType] = useState('announcement');
    const [bulkMessage, setBulkMessage] = useState('');

    // 🌟 NEW: Chat Panel States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatUser, setChatUser] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({ search: searchQuery, status: statusFilter }).toString();
                const response = await fetch(`http://localhost:3000/api/admin/students-list?${queryParams}`, { credentials: 'include' });
                const data = await response.json();
                
                if (data.success) {
                    setStudents(data.data);
                    setSelectedUsers([]); // Clear selections when search changes
                }
            } catch (error) {
                console.error("Failed to load students list:", error);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(() => fetchStudents(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter]);

    // Checkbox Logic
    const handleSelectAll = () => {
        if (selectedUsers.length === students.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(students.map(s => s.user_id));
        }
    };

    const handleSelectStudent = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    // Submit Bulk Action
    const handleBulkSubmit = async () => {
        if (!bulkMessage.trim()) return;

        const title = bulkType === 'offer' ? 'Exclusive Discount Offer!' : 'Platform Announcement';

        try {
            const response = await fetch('http://localhost:3000/api/admin/students/bulk-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedUsers,
                    title: title,
                    message: bulkMessage
                }),
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                alert(result.message);
                setIsBulkModalOpen(false);
                setBulkMessage('');
                setSelectedUsers([]);
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("Failed to process bulk action.");
        }
    };

    const openBulkModal = (type) => {
        setBulkType(type);
        setIsBulkModalOpen(true);
    };

    // 🌟 NEW: Handle Sending the Chat Message
    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        setIsSending(true);

        try {
            const response = await fetch('http://localhost:3000/api/admin/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: adminId,
                    receiverId: chatUser.id,
                    message: chatMessage
                }),
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                setChatMessage('');
                setIsChatOpen(false);
                alert(`Message sent securely to ${chatUser.name}!`);
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen relative overflow-hidden">
            
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Student Directory</h1>
                    <p className="text-gray-500 mt-1">Manage, monitor, and assist the learners on your platform.</p>
                </div>
                <button 
                    onClick={() => navigate('/admin')}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 mb-6 items-center">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or phone..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Filter className="text-gray-400" size={18} />
                    <select 
                        className="py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium text-gray-700 cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Active Students</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Floating Bar */}
            {selectedUsers.length > 0 && (
                <div className="bg-[#4a0b59] text-white px-6 py-4 rounded-2xl shadow-lg mb-6 flex justify-between items-center animate-in fade-in slide-in-from-bottom-4 transition-all">
                    <div className="flex items-center space-x-4">
                        <span className="bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {selectedUsers.length}
                        </span>
                        <span className="font-bold text-lg">Students Selected</span>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => openBulkModal('announcement')} 
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium flex items-center transition-colors"
                        >
                            <Megaphone size={16} className="mr-2" /> Make Announcement
                        </button>
                        <button 
                            onClick={() => openBulkModal('offer')} 
                            className="px-4 py-2 bg-white text-[#4a0b59] hover:bg-gray-100 rounded-xl font-bold flex items-center shadow-sm transition-colors"
                        >
                            <Gift size={16} className="mr-2" /> Send Discount Offer
                        </button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] mb-12">
                <div className="overflow-visible w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                {/* Select All Checkbox */}
                                <th className="p-4 rounded-tl-2xl w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 cursor-pointer accent-[#4a0b59]"
                                        checked={students.length > 0 && selectedUsers.length === students.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 font-bold">Student</th>
                                <th className="p-4 font-bold">Grade / School</th>
                                <th className="p-4 font-bold text-center">Active Enrollments</th>
                                <th className="p-4 font-bold">Account Status</th>
                                <th className="p-4 font-bold text-center rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">Loading students...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">No students found matching your filters.</td></tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.student_id} className={`transition-colors ${selectedUsers.includes(student.user_id) ? 'bg-purple-50/50' : 'hover:bg-gray-50/50'}`}>
                                        
                                        {/* Individual Checkbox */}
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 cursor-pointer accent-[#4a0b59]"
                                                checked={selectedUsers.includes(student.user_id)}
                                                onChange={() => handleSelectStudent(student.user_id)}
                                            />
                                        </td>

                                        {/* Student Info */}
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 overflow-hidden">
                                                    {student.picture ? (
                                                        <img src={`http://localhost:3000/uploads/${student.picture}`} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                                    <p className="text-xs text-gray-500">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <p className="text-sm text-gray-900 font-bold">{student.grade_level || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{student.school_name || 'School not provided'}</p>
                                        </td>

                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700">
                                                {student.active_enrollments}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${student.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {student.account_status}
                                            </span>
                                        </td>

                                        {/* Action Menu */}
                                        <td className="p-4 text-center relative">
                                            <button 
                                                onClick={() => setOpenMenuId(openMenuId === student.student_id ? null : student.student_id)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === student.student_id && (
                                                <div className="absolute right-8 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 text-left">
                                                    <Link 
                                                        to={`/admin/student-profile/${student.student_id}`} 
                                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                    >
                                                        <Eye size={16} className="mr-2" /> View Profile
                                                    </Link>

                                                    {/* 🌟 NEW: The Message Button */}
                                                    <button 
                                                        onClick={() => {
                                                            setChatUser({ id: student.user_id, name: student.name, picture: student.picture });
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

            {/* Bulk Action Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        
                        <div className={`p-6 border-b border-gray-100 flex justify-between items-center text-white
                            ${bulkType === 'offer' ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-[#4a0b59] to-purple-700'}`}>
                            <h2 className="text-xl font-bold flex items-center">
                                {bulkType === 'offer' ? <Gift className="mr-2" /> : <Megaphone className="mr-2" />}
                                {bulkType === 'offer' ? 'Send Group Offer' : 'Group Announcement'}
                            </h2>
                            <button onClick={() => setIsBulkModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4 font-medium">
                                This message will be sent directly to the inbox of the <span className="font-bold text-gray-900">{selectedUsers.length} selected students</span>.
                            </p>
                            
                            {bulkType === 'offer' && (
                                <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-800">
                                    <strong>Heads up!</strong> This sends a message to the students telling them about an offer. Make sure you have actually created the code in your <strong>Marketing & Offers</strong> tab first!
                                </div>
                            )}

                            <textarea 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white resize-none"
                                rows="5"
                                placeholder={bulkType === 'offer' ? "Hey! Use code ZIRON50 at checkout to get 50% off your next course..." : "Type your announcement here..."}
                                value={bulkMessage}
                                onChange={(e) => setBulkMessage(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsBulkModalOpen(false)}
                                className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleBulkSubmit}
                                disabled={!bulkMessage.trim()}
                                className={`px-6 py-2 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                                    ${bulkType === 'offer' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#4a0b59] hover:bg-purple-900'}`}
                            >
                                Send to {selectedUsers.length} Students
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 NEW: The Slide-Out Chat Drawer */}
            {isChatOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
                    onClick={() => setIsChatOpen(false)}
                ></div>
            )}
            
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 overflow-hidden">
                            {chatUser?.picture ? <img src={`http://localhost:3000/uploads/${chatUser.picture}`} alt="Avatar" className="w-full h-full object-cover" /> : chatUser?.name?.charAt(0)}
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

                {/* Chat Instructions */}
                <div className="flex-1 p-6 bg-white overflow-y-auto">
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm mb-4">
                        <p className="font-bold mb-1 flex items-center"><Clock size={16} className="mr-1.5"/> Auto-Delete Enabled</p>
                        <p className="text-blue-600/80">Messages sent here are highly secure and will automatically self-destruct after 7 days to protect user privacy.</p>
                    </div>
                    <p className="text-gray-400 text-sm text-center mt-10">Start a new secure conversation with {chatUser?.name}...</p>
                </div>

                {/* Chat Input Area */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <textarea 
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none text-sm"
                        rows="3"
                        placeholder="Type your message here..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim() || isSending}
                            className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:opacity-50"
                        >
                            {isSending ? 'Sending...' : <><Send size={16} className="mr-2" /> Send Message</>}
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Admin_Students;