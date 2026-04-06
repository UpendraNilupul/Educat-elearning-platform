import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  MessageSquare, ArrowLeft, Send, ShieldAlert, 
  Search, Plus, X, UserCircle
} from "lucide-react";

const StudentChat = () => {
  const studentId = parseInt(localStorage.getItem('userId')) || 2; // Default to 2 for safe testing

  // Chat States
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Composing States
  const [isComposing, setIsComposing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ==========================================
  // 🌟 INITIALIZE SOCKET CONNECTION
  // ==========================================
  useEffect(() => {
      const newSocket = io("http://localhost:3000");
      setSocket(newSocket);

      // Optionally Register Student as online
      if (studentId) {
          newSocket.emit("register_user", studentId);
      }

      newSocket.on("receive_message", (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
      });

      return () => newSocket.disconnect();
  }, [studentId]);

  // Join Room when a chat is clicked
  useEffect(() => {
      if (socket && activeChat && activeChat.conversation_id && !activeChat.conversation_id.toString().startsWith('temp_')) {
          socket.emit("join_room", activeChat.conversation_id);
      }
  }, [socket, activeChat]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==========================================
  // 🌟 DATA FETCHING
  // ==========================================
  const fetchConversations = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/student-chat/conversations', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setConversations(data.data);
    } catch (error) {
        console.error("Failed to load inbox");
    }
  };

  const fetchContacts = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/student-chat/contacts', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setContacts(data.data);
    } catch (error) {
        console.error("Failed to load contacts");
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
        const res = await fetch(`http://localhost:3000/api/student-chat/conversations/${conversationId}/messages`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setMessages(data.data);
    } catch (error) {
        console.error("Failed to load messages");
    }
  };

  // Initial Load
  useEffect(() => {
      fetchConversations();
  }, []);

  // ==========================================
  // 🌟 ACTIONS
  // ==========================================
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
    if (!chatMessage.trim() || !activeChat) return;
    setIsSending(true);

    try {
        const response = await fetch('http://localhost:3000/api/student-chat/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: studentId,
                receiverId: activeChat.other_user_id,
                message: chatMessage
            }),
            credentials: 'include'
        });

        const result = await response.json();
        
        if (result.success) {
            const newMessage = { sender_id: studentId, body: chatMessage, created_at: new Date().toISOString() };
            setMessages((prev) => [...prev, newMessage]);
            
            if (socket && !activeChat.conversation_id.toString().startsWith('temp_')) {
                socket.emit("send_message", { room: activeChat.conversation_id, message: newMessage });
            }

            setChatMessage('');
            fetchConversations(); // Refresh inbox silently
        } else {
            alert("Backend blocked it: " + result.message);
        }
    } catch (error) {
        alert("Failed to send message.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      
      {/* ========================================== */}
      {/* LEFT PANEL: INBOX / CONTACTS             */}
      {/* ========================================== */}
      <div className={`w-full md:w-1/3 lg:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
          {isComposing ? (
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsComposing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                 </button>
                 <h2 className="text-xl font-black text-gray-900">New Message</h2>
             </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-gray-900 flex items-center">
                <MessageSquare className="mr-3 text-[#4a0b59]" size={24} /> My Inbox
              </h2>
              <button onClick={() => { fetchContacts(); setIsComposing(true); }} className="p-2 text-white bg-[#4a0b59] hover:bg-purple-900 rounded-full transition-colors shadow-sm" title="New Message">
                  <Plus size={20} />
              </button>
            </>
          )}
        </div>

        {/* Search Bar (Only visible when composing) */}
        {isComposing && (
            <div className="p-4 border-b border-gray-200 bg-white shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search teachers or admins..." 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#4a0b59] focus:ring-1 focus:ring-[#4a0b59]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isComposing ? (
                /* CONTACTS LIST */
                contacts
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((contact) => (
                    <button 
                        key={contact.user_id}
                        onClick={() => startNewChat(contact)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all flex items-center space-x-4 text-left group"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                            {contact.picture ? <img src={`http://localhost:3000/uploads/${contact.picture}`} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-gray-900 truncate">{contact.name}</h4>
                            <p className="text-xs text-purple-600 font-medium capitalize">{contact.role_name}</p>
                        </div>
                    </button>
                ))
            ) : (
                /* CONVERSATIONS LIST */
                conversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="font-medium text-gray-500">Inbox is completely clear.</p>
                        <button onClick={() => { fetchContacts(); setIsComposing(true); }} className="mt-4 px-4 py-2 bg-white border border-gray-200 shadow-sm text-[#4a0b59] font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            Ask a Teacher
                        </button>
                    </div>
                ) : (
                    conversations.map((chat) => (
                        <button 
                            key={chat.conversation_id}
                            onClick={() => {
                                setActiveChat(chat);
                                fetchMessages(chat.conversation_id);
                            }}
                            className={`w-full p-4 border rounded-2xl transition-all flex items-center space-x-4 text-left group ${activeChat?.conversation_id === chat.conversation_id ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-gray-100 hover:shadow-md'}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                                {chat.other_user_picture ? <img src={`http://localhost:3000/uploads/${chat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : chat.other_user_name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h4 className="font-bold text-gray-900 truncate pr-2">{chat.other_user_name}</h4>
                                </div>
                                <p className="text-xs text-purple-600 font-medium capitalize flex items-center">
                                    {chat.other_user_role === 'admin' && <ShieldAlert size={12} className="mr-1" />}
                                    {chat.other_user_role}
                                </p>
                            </div>
                        </button>
                    ))
                )
            )}
        </div>
      </div>

      {/* ========================================== */}
      {/* RIGHT PANEL: ACTIVE CHAT THREAD          */}
      {/* ========================================== */}
      <div className={`flex-1 flex flex-col bg-white ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {!activeChat ? (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                  <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                      <MessageSquare size={40} className="text-purple-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Student Messages</h3>
                  <p className="text-sm text-gray-500 max-w-sm text-center">Select a conversation from the left menu or start a new chat to connect with your teachers and support staff.</p>
              </div>
          ) : (
              // Active Chat State
              <>
                {/* Chat Header */}
                <div className="p-4 md:p-6 border-b border-gray-200 flex items-center space-x-4 bg-white shrink-0">
                    <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors mr-1">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                        {activeChat.other_user_picture ? <img src={`http://localhost:3000/uploads/${activeChat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : activeChat.other_user_name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{activeChat.other_user_name}</h3>
                        <p className="text-xs text-purple-600 uppercase tracking-wider font-bold mt-0.5">{activeChat.other_user_role}</p>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-6">
                    <div className="text-center mb-8">
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm border border-gray-300">
                            Secure Connection Established
                        </span>
                    </div>
                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === studentId;
                        return (
                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] md:max-w-[60%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-[#4a0b59] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                    <p className="text-[15px] leading-relaxed">{msg.body}</p>
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
                <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto">
                        <textarea 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-purple-200 resize-none text-[15px] transition-all shadow-inner"
                            rows="2"
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault(); 
                                    handleSendMessage();
                                }
                            }}
                        ></textarea>
                        <button 
                            type="submit"
                            disabled={!chatMessage.trim() || isSending}
                            className="p-4 bg-[#4a0b59] text-white rounded-2xl hover:bg-purple-900 transition-all shadow-md disabled:opacity-50 disabled:shadow-none hover:shadow-lg active:scale-95"
                        >
                            <Send size={24} />
                        </button>
                    </form>
                </div>
              </>
          )}
      </div>
    </div>
  );
};

export default StudentChat;
