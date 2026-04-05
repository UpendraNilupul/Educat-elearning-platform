// Force Vite HMR reload
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  LayoutDashboard, BookOpen, FileText, Award, Megaphone, Video,
  Users, Calendar, Edit2, Menu, X, MessageSquare, ArrowLeft, Send, 
  ShieldAlert, Bell, Plus, Search
} from "lucide-react";
import TeachersCourse from "./TeachersCourse";

const TeacherDashboard = ({ userName = "Teacher", onLogout }) => {
  const navigate = useNavigate();
  const teacherId = parseInt(localStorage.getItem('userId'));

  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);

  // Inbox & Chat States
  const [isInboxOpen, setIsInboxOpen] = useState(false);
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

  // Initialize Socket
  useEffect(() => {
      const newSocket = io("http://localhost:3000");
      setSocket(newSocket);
      newSocket.on("receive_message", (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
      });
      return () => newSocket.disconnect();
  }, []);

  // Join Room
  useEffect(() => {
      if (socket && activeChat && activeChat.conversation_id && !activeChat.conversation_id.toString().startsWith('temp_')) {
          socket.emit("join_room", activeChat.conversation_id);
      }
  }, [socket, activeChat]);

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const id = localStorage.getItem('userId');
        const url = id ? `http://localhost:3000/api/courses?teacherId=${id}` : 'http://localhost:3000/api/courses';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setCourses(data.map(course => ({
            ...course, students: course.students || 0, modules: course.modules || 0, progress: course.progress || 0, chapters: course.chapters || []
          })));
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch Inbox Conversations
  const fetchConversations = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/teacher-chat/conversations', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setConversations(data.data);
    } catch (error) {
        console.error("Failed to load inbox");
    }
  };

  // Fetch Contacts for New Message
  const fetchContacts = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/teacher-chat/contacts', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setContacts(data.data);
    } catch (error) {
        console.error("Failed to load contacts");
    }
  };

  // Fetch specific Chat Messages
  const fetchMessages = async (conversationId) => {
    try {
        const res = await fetch(`http://localhost:3000/api/teacher-chat/conversations/${conversationId}/messages`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setMessages(data.data);
    } catch (error) {
        console.error("Failed to load messages");
    }
  };

  // Open Inbox Trigger
  useEffect(() => {
      if (isInboxOpen && !activeChat && !isComposing) {
          fetchConversations();
      }
  }, [isInboxOpen, activeChat, isComposing]);

  // Start a chat from the contacts list
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

  // Send Message Logic
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeChat) return;
    setIsSending(true);

    try {
        const response = await fetch('http://localhost:3000/api/teacher-chat/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: teacherId,
                receiverId: activeChat.other_user_id,
                message: chatMessage
            }),
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            const newMessage = { sender_id: teacherId, body: chatMessage, created_at: new Date().toISOString() };
            setMessages((prev) => [...prev, newMessage]);
            
            if (socket && !activeChat.conversation_id.toString().startsWith('temp_')) {
                socket.emit("send_message", { room: activeChat.conversation_id, message: newMessage });
            }

            setChatMessage('');
            // Refresh inbox silently so it updates the side list
            fetchConversations();
        }
    } catch (error) {
        alert("Failed to send message.");
    } finally {
        setIsSending(false);
    }
  };

  const classes = [
    { title: "React Live Session", course: "Full Stack Web Development", date: "Oct 25", time: "10:00 AM" },
    { title: "Figma Design Workshop", course: "UI/UX Design", date: "Oct 27", time: "2:00 PM" },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-40 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#4a0b59] tracking-wide">Educat</h2>
        <div className="flex items-center space-x-2">
          <button className="relative p-2 text-gray-400 hover:text-[#4a0b59] transition-colors">
            <Bell size={22} />
            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:text-[#4a0b59]">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[#4a0b59] tracking-wide">Educat Teacher</h2>
          <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Course Management", icon: BookOpen },
            { name: "Assessments", icon: FileText },
            { name: "Certification", icon: Award },
            { name: "Marketing", icon: Megaphone },
            { name: "Virtual Classroom", icon: Video },
            { name: "Messages", icon: MessageSquare },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.name === "Messages") {
                    setIsInboxOpen(true);
                    setActiveChat(null);
                    setIsComposing(false);
                    setIsSidebarOpen(false);
                } else {
                    setActiveTab(item.name);
                    setIsInboxOpen(false);
                    setIsSidebarOpen(false);
                }
              }}
              className={`flex items-center text-left gap-4 w-full px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.name && item.name !== "Messages"
                  ? "bg-[#4a0b59] text-white font-semibold shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:shadow-sm"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-5 border-t bg-gray-50 rounded-tl-xl rounded-tr-xl mt-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-[#4a0b59] text-lg shrink-0">
              {userName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <button onClick={() => { navigate(`/teacher-profile-edit/${teacherId}`); setIsSidebarOpen(false); }} className="text-gray-400 hover:text-[#4a0b59] transition-colors p-1 shrink-0">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">Teacher</p>
            </div>
          </div>
          <button onClick={() => { if (onLogout) onLogout(); navigate('/'); }} className="text-red-500 text-sm text-left hover:text-red-600 font-medium transition-colors px-1">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        <header className="hidden lg:flex h-20 items-center justify-end px-10 shrink-0 z-10 w-full pt-4">
            <button className="relative p-2.5 text-gray-400 hover:text-[#4a0b59] bg-white border border-gray-200 shadow-sm rounded-full transition-all hover:shadow-md">
              <Bell size={22} />
              <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-10 lg:pb-10 lg:pt-2 flex flex-col gap-8 mt-16 lg:mt-0">
          {activeTab === "Overview" && (
            <div className="animate-in fade-in duration-500 flex flex-col gap-8">
              <div className="mt-2 lg:mt-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-snug">Welcome back, {userName} 👋</h1>
              <p className="text-gray-500 mt-2 text-base lg:text-lg max-w-2xl">Manage courses, students, and live classes from your dashboard.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
                <div className="p-3 bg-purple-50 rounded-xl"><BookOpen className="text-purple-600 w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Courses</p>
                  <h3 className="text-2xl lg:text-3xl font-bold">{courses.length}</h3>
                </div>
              </div>

              <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300">
                <div className="p-3 bg-blue-50 rounded-xl"><Users className="text-blue-600 w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Students</p>
                  <h3 className="text-2xl lg:text-3xl font-bold">320</h3>
                </div>
              </div>

              <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-lg flex items-center gap-5 hover:shadow-xl transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                <div className="p-3 bg-orange-50 rounded-xl"><FileText className="text-orange-500 w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Reviews</p>
                  <h3 className="text-2xl lg:text-3xl font-bold">8</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl lg:text-2xl font-bold">Live Classes</h2>
                  <button className="text-sm text-purple-600 font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {classes.map((cls, index) => (
                    <div key={index} className="bg-white p-5 rounded-2xl shadow-md flex justify-between items-center hover:shadow-lg transition-shadow duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                          <Video className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{cls.title}</h3>
                          <p className="text-xs text-gray-500">{cls.course}</p>
                          <p className="text-xs text-purple-600 mt-1 font-medium">{cls.date} • {cls.time}</p>
                        </div>
                      </div>
                      <Calendar className="text-gray-300 w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">Recent Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 mb-4">{course.students} Students enrolled</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "Course Management" && <TeachersCourse courses={courses} setCourses={setCourses} />}
        </main>
      </div>

      {/* ========================================== */}
      {/* SLIDING INBOX DRAWER */}
      {/* ========================================== */}
      
      {isInboxOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsInboxOpen(false)}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isInboxOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* State 1: New Message Contact List */}
        {isComposing ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white shadow-sm z-10">
                <button onClick={() => setIsComposing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors mr-1">
                    <ArrowLeft size={20} />
                </button>
                <h3 className="font-bold text-gray-900 flex-1">New Message</h3>
            </div>
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search students or admins..." 
                        className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[#4a0b59] focus:ring-1 focus:ring-[#4a0b59]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {contacts
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((contact) => (
                    <button 
                        key={contact.user_id}
                        onClick={() => startNewChat(contact)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all flex items-center space-x-4 text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                            {contact.picture ? <img src={`http://localhost:3000/uploads/${contact.picture}`} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-gray-900 truncate">{contact.name}</h4>
                            <p className="text-xs text-purple-600 font-medium capitalize">{contact.role_name}</p>
                        </div>
                    </button>
                ))}
            </div>
          </>
        ) : !activeChat ? (
          /* State 2: The Inbox List View */
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-900 flex items-center">
                <MessageSquare className="mr-3 text-[#4a0b59]" size={24} /> My Inbox
              </h2>
              <div className="flex items-center gap-2">
                  <button onClick={() => { fetchContacts(); setIsComposing(true); }} className="p-2 text-white bg-[#4a0b59] hover:bg-purple-900 rounded-full transition-colors shadow-sm" title="New Message">
                      <Plus size={20} />
                  </button>
                  <button onClick={() => setIsInboxOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {conversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="font-medium text-gray-500">No active conversations.</p>
                        <button onClick={() => { fetchContacts(); setIsComposing(true); }} className="mt-4 px-4 py-2 bg-purple-50 text-[#4a0b59] font-semibold rounded-lg text-sm hover:bg-purple-100 transition-colors">
                            Start a chat
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
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all flex items-center space-x-4 text-left group"
                        >
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                                {chat.other_user_picture ? <img src={`http://localhost:3000/uploads/${chat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : chat.other_user_name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-gray-900 truncate">{chat.other_user_name}</h4>
                                <p className="text-xs text-purple-600 font-medium capitalize flex items-center mt-0.5">
                                    <ShieldAlert size={12} className="mr-1" /> {chat.other_user_role} Support
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
          </>
        ) : (
          /* State 3: The Active Chat View */
          <>
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-white shadow-sm z-10">
                <button onClick={() => setActiveChat(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors mr-1">
                    <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#4a0b59] font-bold shrink-0 overflow-hidden">
                    {activeChat.other_user_picture ? <img src={`http://localhost:3000/uploads/${activeChat.other_user_picture}`} alt="Avatar" className="w-full h-full object-cover" /> : activeChat.other_user_name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{activeChat.other_user_name}</h3>
                    <p className="text-[10px] text-purple-600 uppercase tracking-wider font-bold">{activeChat.other_user_role} Support</p>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-4">
                <div className="text-center mb-6">
                    <span className="bg-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Secure Connection Established</span>
                </div>
                {messages.map((msg, i) => {
                    const isMe = msg.sender_id === teacherId;
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-[#4a0b59] text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                <p className="text-sm leading-relaxed">{msg.body}</p>
                                <p className={`text-[10px] mt-2 font-bold ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <textarea 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm transition-all"
                    rows="2"
                    placeholder="Type a secure message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                ></textarea>
                <button 
                    type="submit"
                    disabled={!chatMessage.trim() || isSending}
                    className="p-3 bg-[#4a0b59] text-white rounded-xl hover:bg-purple-900 transition-colors shadow-md disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </form>
          </>
        )}
      </div>

    </div>
  );
};

export default TeacherDashboard;