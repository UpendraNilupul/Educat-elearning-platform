import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MessageSquare, Megaphone, ArrowLeft, Send, User, Clock, Users, Search
} from 'lucide-react';

const Admin_Communications = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const adminId = parseInt(localStorage.getItem('userId'));

    const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'announcements'
    
    // Message States
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Announcement States
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        if (activeChat) fetchMessages(activeChat.conversation_id);
    }, [activeChat]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'messages') {
                const res = await fetch('http://localhost:3000/api/admin/conversations', { credentials: 'include' });
                const data = await res.json();
                if (data.success) setConversations(data.data);
            } else {
                const res = await fetch('http://localhost:3000/api/admin/announcements-history', { credentials: 'include' });
                const data = await res.json();
                if (data.success) setAnnouncements(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/conversations/${conversationId}/messages`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setMessages(data.data);
        } catch (error) {
            console.error("Failed to fetch messages");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const response = await fetch('http://localhost:3000/api/admin/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: adminId,
                    receiverId: activeChat.other_user_id,
                    message: newMessage
                }),
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                // Optimistically add message to UI
                setMessages([...messages, { sender_id: adminId, body: newMessage, created_at: new Date().toISOString() }]);
                setNewMessage('');
                
                // Bump conversation to top
                fetchData(); 
            }
        } catch (error) {
            alert("Failed to send message.");
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
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-gray-900 truncate">{chat.other_user_name}</h4>
                                                <p className="text-xs text-gray-500 capitalize">{chat.other_user_role}</p>
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
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-4">
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender_id === adminId;
                                            return (
                                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-[#4a0b59] text-white rounded-br-sm shadow-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                                                        <p className="text-sm">{msg.body}</p>
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
                                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-end gap-3">
                                        <textarea 
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm"
                                            rows="2"
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        ></textarea>
                                        <button 
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="p-3 bg-[#4a0b59] text-white rounded-xl hover:bg-purple-900 transition-colors shadow-md disabled:opacity-50"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </form>
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

            </div>
        </div>
    );
};

export default Admin_Communications;