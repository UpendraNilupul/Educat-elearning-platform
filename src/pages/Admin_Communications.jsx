import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
    MessageSquare, Megaphone, ArrowLeft, Send, Clock, Users, Search, 
    Paperclip, FileIcon, X, ShieldAlert, Plus
} from 'lucide-react';
import api from '../api';

const Admin_Communications = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const adminId = parseInt(localStorage.getItem('userId'));
    const autoOpenSenderName = location.state?.autoOpenSenderName || null;

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'messages'); 
    
    // Chat States
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const [socket, setSocket] = useState(null);

    // Composing & Contact States
    const [isComposing, setIsComposing] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Attachment States
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Announcement States
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat Requests & Block States
    const [chatRequests, setChatRequests] = useState([]);
    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [isBlockedByThem, setIsBlockedByThem] = useState(false);

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

    // ==========================================
    // 🌟 INITIALIZE SOCKET CONNECTION
    // ==========================================
    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
        const newSocket = io(SOCKET_URL, {
            withCredentials: true
        });
        
        setSocket(newSocket);

        if (adminId) {
            newSocket.emit("register_user", adminId);
        }

        newSocket.on("receive_message", (incomingMessage) => {
            setMessages((prev) => [...prev, incomingMessage]);
        });

        newSocket.on("chat_requests_updated", () => {
            fetchChatRequests();
            fetchData();
        });

        return () => newSocket.disconnect();
    }, [adminId]);

    // Join Room when a chat is clicked
    useEffect(() => {
        if (socket && activeChat && activeChat.conversation_id && !activeChat.conversation_id.toString().startsWith('temp_')) {
            socket.emit("join_room", activeChat.conversation_id);
        }
    }, [socket, activeChat]);

    // ==========================================
    // 🌟 DATA FETCHING & AUTO-LOGIC
    // ==========================================
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchData();
        if (activeTab === 'messages') {
            api.put('/chat/mark-notifications-read').catch(err => {});
        } else if (activeTab === 'chat_requests') {
            fetchChatRequests();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeChat) {
            if (!activeChat.conversation_id.toString().startsWith('temp_')) {
                fetchMessages(activeChat.conversation_id);
            }
            checkBlockStatus(activeChat.other_user_id);
        } else {
            setIsBlockedByMe(false);
            setIsBlockedByThem(false);
        }
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
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [autoOpenSenderName, conversations, navigate, location.pathname]);

    // Auto-read messages when new messages are loaded/received in active chat
    useEffect(() => {
        if (activeChat && !activeChat.conversation_id.toString().startsWith('temp_') && messages.length > 0) {
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
                const res = await api.get('/admin-chat/conversations');
                if (res.data.success) setConversations(res.data.data);
            } else if (activeTab === 'announcements') {
                const res = await api.get('/admin/announcements-history');
                if (res.data.success) setAnnouncements(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const res = await api.get('/admin-chat/contacts');
            if (res.data.success) setContacts(res.data.data);
        } catch (error) {
            console.error("Failed to load contacts");
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const res = await api.get(`/admin-chat/conversations/${conversationId}/messages`);
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

    const fetchChatRequests = async () => {
        try {
            const res = await api.get('/admin-chat/requests');
            if (res.data.success) {
                setChatRequests(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch chat requests:", error);
        }
    };

    const handleUpdateRequestStatus = async (id, status) => {
        try {
            const res = await api.put(`/admin-chat/requests/${id}`, { status });
            if (res.data.success) {
                fetchChatRequests();
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update request status.");
        }
    };

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

    // Start a New Chat
    const startNewChat = (contact) => {
        const existingChat = conversations.find(c => c.other_user_id === contact.user_id);
        if (existingChat) {
            setActiveChat(existingChat);
            fetchMessages(existingChat.conversation_id);
        } else {
            setActiveChat({
                conversation_id: `temp_${contact.user_id}`,
                other_user_id: contact.user_id,
                other_user_name: contact.name,
                other_user_picture: contact.picture,
                other_user_role: contact.role_name
            });
            setMessages([]);
        }
        setIsComposing(false);
        setSearchTerm("");
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeChat) return;
        setIsSending(true);

        try {
            let fileUrl = null;
            let fileType = null;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await api.post('/chat/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success) {
                    fileUrl = uploadRes.data.fileUrl;
                    fileType = uploadRes.data.fileType;
                } else {
                    throw new Error("File upload failed");
                }
            }

            const response = await api.post('/admin-chat/send-message', {
                senderId: adminId,
                receiverId: activeChat.other_user_id,
                message: newMessage,
                fileUrl,
                fileType
            });

            if (response.data.success) {
                const newMsgObj = { 
                    sender_id: adminId, 
                    body: newMessage, 
                    file_url: fileUrl,
                    file_type: fileType,
                    created_at: new Date().toISOString() 
                };
                
                setMessages((prev) => [...prev, newMsgObj]);
                
                if (socket && !activeChat.conversation_id.toString().startsWith('temp_')) {
                    socket.emit("send_message", { room: activeChat.conversation_id, message: newMsgObj });
                }

                setNewMessage('');
                setSelectedFile(null);
                setFilePreview(null);
                fetchData(); // Silently refresh conversations list to bump to top
            }
        } catch (error) {
            alert(error.response?.data?.message || error.message || "Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden p-8 font-sans bg-gray-50">
            {/* Header */}
            <div className="flex items-end justify-between w-full mb-6 shrink-0 max-w-[1400px] mx-auto">
                <div>
                    <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="flex items-center text-3xl font-black text-gray-900">
                        <MessageSquare className="mr-3 text-[#4a0b59]" size={32} /> Communications Hub
                    </h1>
                </div>
                
                {/* Tab Toggles */}
                <div className="flex p-1 bg-white border border-gray-200 shadow-sm rounded-xl shrink-0">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${activeTab === 'messages' ? 'bg-[#4a0b59] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <MessageSquare size={16} className="mr-2" /> Direct Messages
                    </button>
                    <button 
                        onClick={() => setActiveTab('chat_requests')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${activeTab === 'chat_requests' ? 'bg-[#4a0b59] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Clock size={16} className="mr-2" /> Chat Requests
                    </button>
                    <button 
                        onClick={() => setActiveTab('announcements')}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center ${activeTab === 'announcements' ? 'bg-[#4a0b59] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Megaphone size={16} className="mr-2" /> Announcement History
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full flex-1 max-w-[1400px] mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex min-h-0">
                
                {/* ================= DIRECT MESSAGES TAB ================= */}
                {activeTab === 'messages' && (
                    <>
                        {/* Left Sidebar: Conversations / Contacts List */}
                        <div className={`w-full md:w-1/3 lg:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                            
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shrink-0">
                                {isComposing ? (
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setIsComposing(false)} className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100">
                                            <ArrowLeft size={20} />
                                        </button>
                                        <h2 className="text-xl font-black text-gray-900">New Chat</h2>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="flex items-center text-xl font-black text-gray-900">
                                            <MessageSquare className="mr-3 text-[#4a0b59]" size={24} /> Inbox
                                        </h2>
                                        <button onClick={() => { fetchContacts(); setIsComposing(true); }} className="p-2 text-white bg-[#4a0b59] hover:bg-purple-900 rounded-full transition-colors shadow-sm" title="New Message">
                                            <Plus size={20} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Search Bar (Only visible when composing) */}
                            {isComposing && (
                                <div className="p-4 bg-white border-b border-gray-200 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input 
                                            type="text" 
                                            placeholder="Search students or teachers..." 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#4a0b59] focus:ring-1 focus:ring-[#4a0b59]"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* List Content */}
                            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                                {isComposing ? (
                                    /* CONTACTS LIST */
                                    contacts
                                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((contact) => (
                                        <button 
                                            key={contact.user_id}
                                            onClick={() => startNewChat(contact)}
                                            className="flex items-center w-full p-3 space-x-4 text-left transition-all bg-white border border-gray-100 group rounded-xl hover:shadow-md"
                                        >
                                            <div className="flex items-center justify-center font-bold text-[#4a0b59] overflow-hidden shrink-0 w-12 h-12 bg-purple-100 rounded-full">
                                                {contact.picture ? <img src={`http://localhost:3000/uploads/${contact.picture}`} alt="Avatar" className="object-cover w-full h-full" /> : contact.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-gray-900 truncate">{contact.name}</h4>
                                                <p className="text-xs font-medium text-purple-600 capitalize">{contact.role_name}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    /* EXISTING CONVERSATIONS LIST */
                                    loading ? (
                                        <p className="p-8 font-medium text-center text-gray-400">Loading chats...</p>
                                    ) : conversations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
                                            <MessageSquare size={48} className="mb-4 opacity-20" />
                                            <p className="font-medium text-gray-500">Inbox is completely clear.</p>
                                            <button onClick={() => { fetchContacts(); setIsComposing(true); }} className="mt-4 px-4 py-2 bg-white border border-gray-200 shadow-sm text-[#4a0b59] font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors">
                                                Send a Message
                                            </button>
                                        </div>
                                    ) : (
                                        conversations.map(chat => (
                                            <button 
                                                key={chat.conversation_id}
                                                onClick={() => setActiveChat(chat)}
                                                className={`w-full p-4 border rounded-2xl transition-all flex items-center space-x-4 text-left group ${activeChat?.conversation_id === chat.conversation_id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-gray-100 hover:shadow-md'}`}
                                            >
                                                <div className="flex items-center justify-center font-bold text-[#4a0b59] overflow-hidden shrink-0 w-12 h-12 bg-purple-100 rounded-full">
                                                    {chat.other_user_picture ? <img src={`http://localhost:3000/uploads/${chat.other_user_picture}`} alt="Avatar" className="object-cover w-full h-full" /> : chat.other_user_name.charAt(0)}
                                                </div>
                                                <div className="flex items-center justify-between flex-1 overflow-hidden">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="pr-2 font-bold text-gray-900 truncate">{chat.other_user_name}</h4>
                                                        <p className="flex items-center text-xs font-medium text-purple-600 capitalize">
                                                            {chat.other_user_role === 'admin' && <ShieldAlert size={12} className="mr-1" />}
                                                            {chat.other_user_role}
                                                        </p>
                                                    </div>
                                                    {chat.unread_count > 0 && activeChat?.conversation_id !== chat.conversation_id && (
                                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm shrink-0">
                                                            {chat.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Active Chat */}
                        <div className={`flex-1 flex flex-col bg-white min-w-0 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                            {!activeChat ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-gray-400 bg-gray-50/30">
                                    <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-purple-50">
                                        <MessageSquare size={40} className="text-purple-300" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold text-gray-700">Admin Messages</h3>
                                    <p className="max-w-sm text-sm text-center text-gray-500">Select a conversation from the left menu or start a new chat to connect with users on your platform.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="flex items-center p-4 space-x-4 bg-white border-b border-gray-200 md:p-6 shrink-0">
                                        <button onClick={() => setActiveChat(null)} className="p-2 mr-1 transition-colors rounded-full text-gray-500 hover:bg-gray-100 md:hidden">
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div className="flex items-center justify-center font-bold text-[#4a0b59] overflow-hidden shrink-0 w-12 h-12 bg-purple-100 rounded-full">
                                            {activeChat.other_user_picture ? <img src={`http://localhost:3000/uploads/${activeChat.other_user_picture}`} alt="Avatar" className="object-cover w-full h-full" /> : activeChat.other_user_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold leading-tight text-gray-900">{activeChat.other_user_name}</h3>
                                            <p className="text-xs text-purple-600 uppercase tracking-wider font-bold mt-0.5">{activeChat.other_user_role}</p>
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
                                    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50/50">
                                        <div className="mb-8 text-center">
                                            <span className="bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm border border-gray-300">
                                                Secure Connection Established
                                            </span>
                                        </div>
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender_id === adminId;
                                            return (
                                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] md:max-w-[60%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-[#4a0b59] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                                        {msg.file_url && (
                                                            <div className="mb-2">
                                                                {msg.file_type?.startsWith('image/') ? (
                                                                    <a href={getFileUrl(msg.file_url)} target="_blank" rel="noopener noreferrer">
                                                                        <img 
                                                                            src={getFileUrl(msg.file_url)} 
                                                                            alt="Attachment" 
                                                                            className="max-w-xs transition-opacity border border-gray-200 rounded-lg cursor-zoom-in md:max-w-md hover:opacity-90" 
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
                                                                        <div className="overflow-hidden text-left">
                                                                            <p className="text-xs font-bold truncate max-w-[200px]">
                                                                                {msg.file_url.split('/').pop().replace(/^\d+-/, '')}
                                                                            </p>
                                                                            <p className={`text-[10px] ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>Click to download</p>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.body && <p className="text-[15px] leading-relaxed">{msg.body}</p>}
                                                        <p className={`text-[10px] mt-2 font-bold ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-4 bg-white border-t border-gray-200 md:p-6 shrink-0">
                                        {isBlockedByMe || isBlockedByThem ? (
                                            <div className="text-center text-sm font-semibold text-red-500 py-3 bg-red-50 rounded-xl border border-red-100 max-w-4xl mx-auto">
                                                {isBlockedByMe 
                                                    ? "You have blocked this user. Unblock to message." 
                                                    : "You cannot message this user."}
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSendMessage} className="flex flex-col max-w-4xl mx-auto gap-3">
                                                {filePreview && (
                                                <div className="relative self-start inline-block p-1 overflow-hidden border border-gray-200 bg-gray-50 rounded-xl">
                                                    <img src={filePreview} alt="Preview" className="object-cover h-20 max-w-xs rounded-lg" />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                                        className="absolute p-1 text-white transition-colors rounded-full top-1 right-1 bg-black/50 hover:bg-black/70"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {!filePreview && selectedFile && (
                                                <div className="flex items-center self-start px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-200 gap-2 rounded-xl">
                                                    <FileIcon size={16} className="text-purple-600" />
                                                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setSelectedFile(null); }}
                                                        className="p-0.5 text-gray-400 transition-colors rounded-full hover:text-gray-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-end w-full gap-3">
                                                <button 
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center justify-center p-4 text-gray-500 transition-all border border-gray-200 shadow-sm bg-gray-50 rounded-2xl hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                                                    title="Attach file or image"
                                                >
                                                    <Paperclip size={24} />
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    onChange={handleFileChange} 
                                                    className="hidden" 
                                                />
                                                <textarea 
                                                    className="flex-1 p-4 shadow-inner outline-none bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-200 resize-none text-[15px] transition-all"
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
                                                    className="p-4 bg-[#4a0b59] text-white rounded-2xl hover:bg-purple-900 transition-all shadow-md disabled:opacity-50 disabled:shadow-none hover:shadow-lg active:scale-95"
                                                >
                                                    <Send size={24} />
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* ================= CHAT REQUESTS TAB ================= */}
                {activeTab === 'chat_requests' && (
                    <div className="flex flex-col w-full min-h-0 bg-gray-50/30">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">Student Chat Requests</h2>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            {chatRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                                    <Clock size={48} className="mb-4 opacity-20" />
                                    <p className="font-medium">No chat requests found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {chatRequests.map((req) => (
                                        <div key={req.id} className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center space-x-4 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                                                        {req.student_picture ? (
                                                            <img src={`http://localhost:3000/uploads/${req.student_picture}`} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            req.student_name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-900 truncate">{req.student_name}</h4>
                                                        <p className="text-xs text-gray-500 truncate">{req.student_email}</p>
                                                    </div>
                                                </div>
                                                {req.message && (
                                                    <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 mb-4 italic">
                                                        "{req.message}"
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-xs text-gray-400 mb-6 font-medium">
                                                    <span>Requested on {new Date(req.created_at).toLocaleDateString()}</span>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                        req.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                        'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex gap-3 mt-auto border-t border-gray-100 pt-4">
                                                    <button 
                                                        onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                                        className="flex-1 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-bold rounded-xl transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                                                        className="flex-1 px-4 py-2 bg-[#4a0b59] hover:bg-purple-900 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= ANNOUNCEMENTS TAB ================= */}
                {activeTab === 'announcements' && (
                    <div className="flex flex-col w-full min-h-0">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">Broadcast History</h2>
                            <button onClick={() => navigate('/admin/announcements')} className="px-4 py-2 bg-[#4a0b59] text-white text-sm font-bold rounded-xl hover:bg-purple-900 transition-colors shadow-sm">
                                + New Broadcast
                            </button>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            {loading ? (
                                <p className="p-8 font-medium text-center text-gray-400">Loading history...</p>
                            ) : announcements.length === 0 ? (
                                <p className="p-8 font-medium text-center text-gray-400">No announcements sent yet.</p>
                            ) : (
                                announcements.map((ann, i) => (
                                    <div key={i} className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-lg font-bold text-gray-900">{ann.title}</h3>
                                            <span className="text-xs font-bold text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-lg">
                                                <Clock size={14} className="mr-1.5" /> {new Date(ann.sent_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="p-4 mb-4 text-sm text-gray-600 border border-gray-100 bg-gray-50 rounded-xl">{ann.description}</p>
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

            </div>
        </div>
    );
};

export default Admin_Communications;