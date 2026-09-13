import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  MessageSquare, ArrowLeft, Send, ShieldAlert, 
  Search, Plus, X, UserCircle, Paperclip, FileIcon
} from "lucide-react";
import api, { API_BASE } from '../api'; // 🌟 THE FIX: Import the API instance

const baseURL = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') 
    : (import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : (API_BASE ? API_BASE.replace(/\/api\/?$/, '') : 'https://educat-elearning-platform.onrender.com'));

const TeacherChat = ({ autoOpenContact, clearAutoOpenContact }) => {
  const teacherId = parseInt(localStorage.getItem('userId'));

  // Chat States
  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Attachment States
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Composing States
  const [isComposing, setIsComposing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Block States
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);

  const getFileUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
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
      // 🌟 THE FIX: Dynamically connect to the backend whether on localhost or live production
      const SOCKET_URL = baseURL;
      const newSocket = io(SOCKET_URL, {
          withCredentials: true // Ensures secure session cookies are sent over WebSockets too
      });
      
      setSocket(newSocket);

      // Register Teacher as online
      if (teacherId) {
          newSocket.emit("register_user", teacherId);
      }

      newSocket.on("receive_message", (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
      });

      return () => newSocket.disconnect();
  }, [teacherId]);

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

  // Auto-open chat of a specific sender or contact when navigating via notification or profile
  useEffect(() => {
      if (autoOpenContact && conversationsLoaded) {
          const chat = conversations.find(
              c => c.other_user_name.toLowerCase() === autoOpenContact.name.toLowerCase() || 
                   c.other_user_id === autoOpenContact.user_id
          );
          if (chat) {
              setActiveChat(chat);
              fetchMessages(chat.conversation_id);
          } else if (autoOpenContact.user_id) {
              // It's a new chat!
              startNewChat(autoOpenContact);
          }
          if (clearAutoOpenContact) {
              clearAutoOpenContact();
          }
      }
  }, [autoOpenContact, conversations, conversationsLoaded, clearAutoOpenContact]);

  // Auto-read messages when new messages are loaded/received in active chat
  useEffect(() => {
      if (activeChat && !activeChat.conversation_id.toString().startsWith('temp_') && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.sender_id !== teacherId) {
              api.put(`/chat/conversations/${activeChat.conversation_id}/read`).catch(err => {});
              api.put('/chat/mark-notifications-read').catch(err => {});
              window.dispatchEvent(new Event('chat_messages_read'));
          }
      }
  }, [messages, activeChat, teacherId]);

  // ==========================================
  // 🌟 DATA FETCHING
  // ==========================================
  const fetchConversations = async () => {
    try {
        // 🌟 THE FIX: Use api.get()
        const res = await api.get('/teacher-chat/conversations');
        if (res.data.success) {
            setConversations(res.data.data);
        }
    } catch (error) {
        console.error("Failed to load inbox");
    } finally {
        setConversationsLoaded(true);
    }
  };

  const fetchContacts = async () => {
    try {
        // 🌟 THE FIX: Use api.get()
        const res = await api.get('/teacher-chat/contacts');
        if (res.data.success) setContacts(res.data.data);
    } catch (error) {
        console.error("Failed to load contacts");
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
        // 🌟 THE FIX: Use api.get()
        const res = await api.get(`/teacher-chat/conversations/${conversationId}/messages`);
        if (res.data.success) {
            setMessages(res.data.data);
            setConversations(prev => prev.map(c => 
                c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
            ));
            window.dispatchEvent(new Event('chat_messages_read'));
        }
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

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!chatMessage.trim() && !selectedFile) || !activeChat) return;
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

        // 🌟 THE FIX: Use api.post()
        const response = await api.post('/teacher-chat/send-message', {
            senderId: teacherId,
            receiverId: activeChat.other_user_id,
            message: chatMessage,
            fileUrl,
            fileType
        });

        const result = response.data;
        
        if (result.success) {
            const newMessage = { 
                sender_id: teacherId, 
                body: chatMessage, 
                file_url: fileUrl,
                file_type: fileType,
                created_at: new Date().toISOString() 
            };
            setMessages((prev) => [...prev, newMessage]);
            
            if (socket && !activeChat.conversation_id.toString().startsWith('temp_')) {
                socket.emit("send_message", { room: activeChat.conversation_id, message: newMessage });
            }

            setChatMessage('');
            setSelectedFile(null);
            setFilePreview(null);
            fetchConversations(); // Refresh inbox silently
        } else {
            alert("Backend blocked it: " + result.message);
        }
    } catch (error) {
        alert(error.response?.data?.message || error.message || "Failed to send message.");
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-[600px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden m-4">
      
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
                 <h2 className="text-xl font-black text-gray-900">New Chat</h2>
             </div>
          ) : (
            <>
              <h2 className="text-xl font-black text-gray-900 flex items-center">
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
            <div className="p-4 border-b border-gray-200 bg-white shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search students or admins..." 
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
                            {contact.picture ? <img src={`${baseURL}/uploads/${contact.picture}`} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0)}
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
                            Send a Message
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
                                {chat.other_user_picture ? <img src={`${baseURL}/uploads/${chat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : chat.other_user_name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-gray-900 truncate pr-2">{chat.other_user_name}</h4>
                                    </div>
                                    <p className="text-xs text-purple-600 font-medium capitalize flex items-center">
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
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Teacher Messages</h3>
                  <p className="text-sm text-gray-500 max-w-sm text-center">Select a conversation from the left menu or start a new chat to connect with students and admins.</p>
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
                        {activeChat.other_user_picture ? <img src={`${baseURL}/uploads/${activeChat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : activeChat.other_user_name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{activeChat.other_user_name}</h3>
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

                {/* Messages Container */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-6">
                    <div className="text-center mb-8">
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm border border-gray-300">
                            Secure Connection Established
                        </span>
                    </div>
                    {messages.map((msg, i) => {
                        const isMe = msg.sender_id === teacherId;
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
                <div className="p-4 md:p-6 bg-white border-t border-gray-200 shrink-0">
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
                                        className="p-4 bg-gray-50 border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-100 hover:text-gray-700 transition-all active:scale-95 shadow-sm flex items-center justify-center"
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
                                        disabled={(!chatMessage.trim() && !selectedFile) || isSending}
                                        className="p-4 bg-[#4a0b59] text-white rounded-2xl hover:bg-purple-900 transition-all shadow-md disabled:opacity-50 disabled:shadow-none hover:shadow-lg active:scale-95"
                                    >
                                        <Send size={24} />
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
              </>
          )}
      </div>
    </div>
  );
};

export default TeacherChat;