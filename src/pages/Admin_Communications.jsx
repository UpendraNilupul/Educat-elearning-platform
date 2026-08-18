import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    MessageSquare, Megaphone, ArrowLeft, Send, User, Clock, Users, Search, Paperclip, FileIcon, X
} from 'lucide-react';
import api from '../api';

const Admin_Communications = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const adminId = parseInt(localStorage.getItem('userId'));
    const autoOpenSenderName = location.state?.autoOpenSenderName || null;

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'messages'); // 'messages' or 'announcements'
    
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);
    // Message States
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [chatRequests, setChatRequests] = useState([]);
    // Block States
    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [isBlockedByThem, setIsBlockedByThem] = useState(false);
    const messagesEndRef = useRef(null);

    // Attachment States
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    const getFileUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
        return `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    // Announcement States
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        if (activeTab === 'messages') {
            api.put('/chat/mark-notifications-read').catch(err => {});
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeChat) fetchMessages(activeChat.conversation_id);
    }, [activeChat]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-open chat of a specific sender when navigating via notification
    useEffect(() => {
        if (autoOpenSenderName && conversations.length > 0) {
            const chat = conversations.find(
                c => c.other_user_name.toLowerCase() === autoOpenSenderName.toLowerCase()
            );
            if (chat) {
                setActiveChat(chat);
                fetchMessages(chat.conversation_id);
            }
            // Clear location state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [autoOpenSenderName, conversations]);

    // Auto-read messages when new messages are loaded/received in active chat
    useEffect(() => {
        if (activeChat && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.sender_id !== adminId) {
                api.put(`/chat/conversations/${activeChat.conversation_id}/read`).catch(err => {});
                api.put('/chat/mark-notifications-read').catch(err => {});
                window.dispatchEvent(new Event('chat_messages_read'));
            }
        }
    }, [messages, activeChat, adminId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'messages') {
                const res = await api.get('/admin/conversations');
                if (res.data.success) setConversations(res.data.data);
            } else if (activeTab === 'chat_requests') {
                const res = await api.get('/admin-chat/requests');
                if (res.data.success) setChatRequests(res.data.data);
            } else {
                // 🌟 THE FIX: Used api.get() and accessed .data
                const res = await api.get('/admin/announcements-history');
                if (res.data.success) setAnnouncements(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAction = async (requestId, status) => {
        try {
            const res = await api.put(`/admin-chat/requests/${requestId}`, { status });
            if (res.data.success) {
                setChatRequests(prev => prev.map(req => 
                    req.id === requestId ? { ...req, status } : req
                ));
            }
        } catch (error) {
            console.error("Failed to update request status:", error);
            alert(error.response?.data?.message || "Failed to update status.");
        }
    };

    // Block/Unblock Handlers
    const checkBlockStatus = async (otherUserId) => {
        try {
            const res = await api.get(`/chat/check-blocked/${otherUserId}`);
            if (res.data.success) {
                setIsBlockedByMe(res.data.isBlockedByMe);
                setIsBlockedByThem(res.data.isBlockedByThem);
            }
        } catch (error) {
            console.error("Failed to check block status:", error);
        }
    };

    useEffect(() => {
        if (activeChat) {
            checkBlockStatus(activeChat.other_user_id);
        } else {
            setIsBlockedByMe(false);
            setIsBlockedByThem(false);
        }
    }, [activeChat]);

    const handleBlock = async () => {
        if (!activeChat) return;
        try {
            const res = await api.post('/chat/block', { blockedId: activeChat.other_user_id });
            if (res.data.success) {
                setIsBlockedByMe(true);
            }
        } catch (error) {
            console.error("Failed to block user:", error);
        }
    };

    const handleUnblock = async () => {
        if (!activeChat) return;
        try {
            const res = await api.post('/chat/unblock', { blockedId: activeChat.other_user_id });
            if (res.data.success) {
                setIsBlockedByMe(false);
            }
        } catch (error) {
            console.error("Failed to unblock user:", error);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            // 🌟 THE FIX: Used api.get() and accessed .data
            const res = await api.get(`/admin/conversations/${conversationId}/messages`);
            if (res.data.success) {
                setMessages(res.data.data);
                setConversations(prev => prev.map(c => 
                    c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
                ));
                window.dispatchEvent(new Event('chat_messages_read'));
            }
        } catch (error) {
            console.error("Failed to fetch messages");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeChat) return;
        setIsSending(true);

        try {
            let fileUrl = null;
            let fileType = null;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await api.post('/chat/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (uploadRes.data.success) {
                    fileUrl = uploadRes.data.fileUrl;
                    fileType = uploadRes.data.fileType;
                } else {
                    throw new Error("File upload failed");
                }
            }

            // 🌟 THE FIX: Used api.post() (it automatically handles headers and JSON.stringify!)
            const response = await api.post('/admin/send-message', {
                senderId: adminId,
                receiverId: activeChat.other_user_id,
                message: newMessage,
                fileUrl,
                fileType
            });

            if (response.data.success) {
                // Optimistically add message to UI
                setMessages([...messages, { 
                    sender_id: adminId, 
                    body: newMessage, 
                    file_url: fileUrl,
                    file_type: fileType,
                    created_at: new Date().toISOString() 
                }]);
                setNewMessage('');
                setSelectedFile(null);
                setFilePreview(null);
                
                // Bump conversation to top
                fetchData(); 
            }
        } catch (error) {
            alert(error.message || "Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans flex flex-col">
            {/* Header */}
            <div className="max-w-7xl mx-auto w-full mb-6 flex justify-between items-end shrink-0">
                <div>
                    <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <MessageSquare className="mr-3 text-[#4a0b59]" size={32} /> Communications Hub
                    </h1>
                </div>
                
                {/* Tab Toggles */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${activeTab === 'messages' ? 'bg-[#4a0b59] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <MessageSquare size={16} className="mr-2" /> Direct Messages
                    </button>
                    <button 
                        onClick={() => setActiveTab('announcements')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${activeTab === 'announcements' ? 'bg-[#4a0b59] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Megaphone size={16} className="mr-2" /> Announcement History
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat_requests')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${activeTab === 'chat_requests' ? 'bg-[#4a0b59] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Clock size={16} className="mr-2" /> Chat Requests
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto w-full flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex">
                
                {/* ================= DIRECT MESSAGES TAB ================= */}
                {activeTab === 'messages' && (
                    <>
                        {/* Left Sidebar: Conversations List */}
                        <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" placeholder="Search chats..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <p className="text-center p-8 text-gray-400 font-medium">Loading chats...</p>
                                ) : conversations.length === 0 ? (
                                    <p className="text-center p-8 text-gray-400 font-medium">No active conversations.</p>
                                ) : (
                                    conversations.map(chat => (
                                        <button 
                                            key={chat.conversation_id}
                                            onClick={() => setActiveChat(chat)}
                                            className={`w-full p-4 flex items-center space-x-3 border-b border-gray-100 transition-all text-left ${activeChat?.conversation_id === chat.conversation_id ? 'bg-purple-50' : 'hover:bg-white'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                                                {chat.other_user_picture ? <img src={`http://localhost:3000/uploads/${chat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : chat.other_user_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 overflow-hidden flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-gray-900 truncate">{chat.other_user_name}</h4>
                                                    <p className="text-xs text-gray-500 capitalize">{chat.other_user_role}</p>
                                                </div>
                                                {chat.unread_count > 0 && activeChat?.conversation_id !== chat.conversation_id && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm shrink-0">
                                                        {chat.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Active Chat */}
                        <div className="flex-1 flex flex-col bg-white">
                            {activeChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white shadow-sm z-10">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                                            {activeChat.other_user_picture ? <img src={`http://localhost:3000/uploads/${activeChat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : activeChat.other_user_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{activeChat.other_user_name}</h3>
                                            <p className="text-xs text-gray-500 capitalize">{activeChat.other_user_role}</p>
                                        </div>

                                        <div className="ml-auto shrink-0 flex items-center">
                                            {isBlockedByMe ? (
                                                <button 
                                                    onClick={handleUnblock}
                                                    className="px-3.5 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    Unblock
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={handleBlock}
                                                    className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                                >
                                                    Block
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-4">
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender_id === adminId;
                                            return (
                                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-[#4a0b59] text-white rounded-br-sm shadow-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                                                        {msg.file_url && (
                                                            <div className="mb-2">
                                                                {msg.file_type?.startsWith('image/') ? (
                                                                    <a href={getFileUrl(msg.file_url)} target="_blank" rel="noopener noreferrer">
                                                                        <img 
                                                                            src={getFileUrl(msg.file_url)} 
                                                                            alt="Attachment" 
                                                                            className="max-w-xs md:max-w-md rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity" 
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <a 
                                                                        href={getFileUrl(msg.file_url)} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className={`flex items-center gap-2 p-3 rounded-xl border ${isMe ? 'bg-purple-900/40 border-purple-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} hover:bg-opacity-80 transition-all`}
                                                                    >
                                                                        <FileIcon size={20} className={isMe ? 'text-purple-200' : 'text-purple-600'} />
                                                                        <div className="text-left overflow-hidden">
                                                                            <p className="text-xs font-bold truncate max-w-[200px]">
                                                                                {msg.file_url.split('/').pop().replace(/^\d+-/, '')}
                                                                            </p>
                                                                            <p className={`text-[10px] ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>Click to download</p>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.body && <p className="text-sm">{msg.body}</p>}
                                                        <p className={`text-[10px] mt-2 font-medium ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                                        <form onSubmit={handleSendMessage} className="flex flex-col gap-3 max-w-4xl mx-auto">
                                            {isBlockedByMe || isBlockedByThem ? (
                                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl p-4 text-center">
                                                    {isBlockedByMe 
                                                        ? "You have blocked this user. Unblock to message." 
                                                        : "You cannot message this user."}
                                                </div>
                                            ) : (
                                                <>
                                                    {filePreview && (
                                                        <div className="relative inline-block self-start border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-1">
                                                            <img src={filePreview} alt="Preview" className="h-20 max-w-xs object-cover rounded-lg" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                                                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!filePreview && selectedFile && (
                                                        <div className="flex items-center gap-2 self-start bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700">
                                                            <FileIcon size={16} className="text-purple-600" />
                                                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => { setSelectedFile(null); }}
                                                                className="text-gray-400 hover:text-gray-600 rounded-full p-0.5 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="flex items-end gap-3 w-full">
                                                        <button 
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="p-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-all active:scale-95 shadow-sm flex items-center justify-center"
                                                            title="Attach file or image"
                                                        >
                                                            <Paperclip size={20} />
                                                        </button>
                                                        <input 
                                                            type="file" 
                                                            ref={fileInputRef} 
                                                            onChange={handleFileChange} 
                                                            className="hidden" 
                                                        />
                                                        <textarea 
                                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm"
                                                            rows="2"
                                                            placeholder="Type your message..."
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault(); 
                                                                    handleSendMessage(e);
                                                                }
                                                            }}
                                                        ></textarea>
                                                        <button 
                                                            type="submit"
                                                            disabled={(!newMessage.trim() && !selectedFile) || isSending}
                                                            className="p-3 bg-[#4a0b59] text-white rounded-xl hover:bg-purple-900 transition-colors shadow-md disabled:opacity-50"
                                                        >
                                                            <Send size={20} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <MessageSquare size={48} className="mb-4 opacity-20" />
                                    <p className="font-medium">Select a conversation to start messaging</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ================= ANNOUNCEMENTS TAB ================= */}
                {activeTab === 'announcements' && (
                    <div className="w-full flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">Broadcast History</h2>
                            <button onClick={() => navigate('/admin/announcements')} className="px-4 py-2 bg-[#4a0b59] text-white text-sm font-bold rounded-xl hover:bg-purple-900 transition-colors shadow-sm">
                                + New Broadcast
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <p className="text-center p-8 text-gray-400 font-medium">Loading history...</p>
                            ) : announcements.length === 0 ? (
                                <p className="text-center p-8 text-gray-400 font-medium">No announcements sent yet.</p>
                            ) : (
                                announcements.map((ann, i) => (
                                    <div key={i} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-bold text-gray-900">{ann.title}</h3>
                                            <span className="text-xs font-bold text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-lg">
                                                <Clock size={14} className="mr-1.5" /> {new Date(ann.sent_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">{ann.description}</p>
                                        <div className="flex items-center text-sm font-bold text-purple-600">
                                            <Users size={16} className="mr-2" />
                                            Delivered to {ann.recipient_count} users
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ================= CHAT REQUESTS TAB ================= */}
                {activeTab === 'chat_requests' && (
                    <div className="w-full flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">Student Messaging Requests</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <p className="text-center p-8 text-gray-400 font-medium">Loading requests...</p>
                            ) : chatRequests.length === 0 ? (
                                <p className="text-center p-8 text-gray-400 font-medium">No pending chat requests.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {chatRequests.map((req) => (
                                        <div key={req.id} className="p-5 bg-white border border-gray-150 rounded-2xl shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold overflow-hidden shrink-0 mt-0.5">
                                                    {req.student_picture ? <img src={`http://localhost:3000/uploads/${req.student_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : req.student_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{req.student_name}</h3>
                                                    <p className="text-xs text-gray-500">{req.student_email}</p>
                                                    {req.message && (
                                                        <p className="text-xs bg-purple-50 text-purple-900 border border-purple-100 rounded-xl p-3 mt-2 font-medium max-w-sm whitespace-pre-wrap italic">
                                                            "{req.message}"
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-1.5">Requested: {new Date(req.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2 shrink-0">
                                                {req.status === 'pending' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleRequestAction(req.id, 'approved')}
                                                            className="px-3.5 py-1.5 bg-[#4a0b59] hover:bg-[#5b0e6e] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRequestAction(req.id, 'rejected')}
                                                            className="px-3.5 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-lg capitalize ${req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                        {req.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Admin_Communications;