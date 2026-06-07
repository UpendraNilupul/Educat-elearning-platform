import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Megaphone, Users, BookOpen, Target, 
    ArrowLeft, Send, AlertCircle, Calendar, GraduationCap
} from 'lucide-react';
import api from '../api';

const Admin_Announcements = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    
    // Form States
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audienceType, setAudienceType] = useState('all'); 
    const [targetId, setTargetId] = useState('');
    
    // 🌟 NEW: Age Range States
    const [minAge, setMinAge] = useState('13');
    const [maxAge, setMaxAge] = useState('19');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data States for Dropdowns
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                // 🌟 THE FIX: Use api.get() instead of fetch()
                const [coursesRes, subjectsRes] = await Promise.all([
                    api.get('/admin/all-courses'),
                    api.get('/admin/subjects')
                ]);
                
                // Axios automatically parses the JSON into the `.data` property!
                const coursesData = coursesRes.data;
                const subjectsData = subjectsRes.data;

                if (coursesData.success) setCourses(coursesData.data);
                if (subjectsData.success) setSubjects(subjectsData.data);
            } catch (error) {
                console.error("Failed to load dropdown data");
            }
        };
        fetchDropdownData();
    }, []);

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        
        if ((audienceType === 'course' || audienceType === 'subject' || audienceType === 'students_by_subject') && !targetId) {
            alert("Please select an option from the dropdown.");
            return;
        }

        if (audienceType === 'students_by_age' && (!minAge || !maxAge || parseInt(minAge) > parseInt(maxAge))) {
            alert("Please enter a valid age range.");
            return;
        }

        if (!window.confirm("Are you sure you want to broadcast this message?")) return;

        setIsSubmitting(true);
        try {
            // 🌟 THE FIX: Use api.post(). It automatically handles headers, JSON stringify, and credentials!
            const response = await api.post('/admin/global-announcement', { 
                audienceType, targetId, minAge, maxAge, title, message 
            });

            const result = response.data; // Axios puts the response body inside .data
            
            if (result.success) {
                alert(result.message);
                setTitle('');
                setMessage('');
                setAudienceType('all');
                setTargetId('');
            } else {
                alert(result.message);
            }
        } catch (error) {
            // Axios puts server error messages inside error.response.data
            const errorMsg = error.response?.data?.message || "Failed to connect to the server.";
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <Megaphone className="mr-3 text-[#4a0b59]" size={32} /> Global Communications
                    </h1>
                    <p className="text-gray-500 mt-1">Broadcast official announcements to targeted groups on the platform.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side: Audience Selection */}
                <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-100 overflow-y-auto max-h-[700px]">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">1. Select Audience</h2>
                    
                    <div className="space-y-3">
                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${audienceType === 'all' ? 'bg-purple-50 border-purple-200 text-[#4a0b59]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                            <input type="radio" name="audience" className="hidden" checked={audienceType === 'all'} onChange={() => {setAudienceType('all'); setTargetId('');}} />
                            <Users size={18} className="mr-3" /> <span className="font-bold text-sm">Everyone</span>
                        </label>

                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${audienceType === 'students' ? 'bg-purple-50 border-purple-200 text-[#4a0b59]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                            <input type="radio" name="audience" className="hidden" checked={audienceType === 'students'} onChange={() => {setAudienceType('students'); setTargetId('');}} />
                            <BookOpen size={18} className="mr-3" /> <span className="font-bold text-sm">All Students</span>
                        </label>

                        {/* 🌟 NEW: Targeted Students by Subject */}
                        <div className={`p-4 border rounded-xl transition-all ${audienceType === 'students_by_subject' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="radio" name="audience" className="hidden" checked={audienceType === 'students_by_subject'} onChange={() => {setAudienceType('students_by_subject'); setTargetId('');}} />
                                <span className={`font-bold text-sm flex items-center ${audienceType === 'students_by_subject' ? 'text-[#4a0b59]' : 'text-gray-700'}`}><GraduationCap size={16} className="mr-2" /> Students by Subject</span>
                            </label>
                            {audienceType === 'students_by_subject' && (
                                <select className="w-full mt-2 p-2 text-sm border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                                    <option value="">Select a subject...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            )}
                        </div>

                        {/* 🌟 NEW: Targeted Students by Age */}
                        <div className={`p-4 border rounded-xl transition-all ${audienceType === 'students_by_age' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="radio" name="audience" className="hidden" checked={audienceType === 'students_by_age'} onChange={() => {setAudienceType('students_by_age'); setTargetId('');}} />
                                <span className={`font-bold text-sm flex items-center ${audienceType === 'students_by_age' ? 'text-[#4a0b59]' : 'text-gray-700'}`}><Calendar size={16} className="mr-2" /> Students by Age Range</span>
                            </label>
                            {audienceType === 'students_by_age' && (
                                <div className="mt-3 flex items-center space-x-2">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Min Age</label>
                                        <input type="number" min="5" max="99" value={minAge} onChange={(e) => setMinAge(e.target.value)} className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300" />
                                    </div>
                                    <span className="text-gray-400 font-bold mt-4">-</span>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 font-bold mb-1 block">Max Age</label>
                                        <input type="number" min="5" max="99" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Targeted: Specific Course */}
                        <div className={`p-4 border rounded-xl transition-all ${audienceType === 'course' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="radio" name="audience" className="hidden" checked={audienceType === 'course'} onChange={() => {setAudienceType('course'); setTargetId('');}} />
                                <span className={`font-bold text-sm flex items-center ${audienceType === 'course' ? 'text-[#4a0b59]' : 'text-gray-700'}`}>Students by Course</span>
                            </label>
                            {audienceType === 'course' && (
                                <select className="w-full mt-2 p-2 text-sm border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                                    <option value="">Select a course...</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            )}
                        </div>

                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${audienceType === 'teachers' ? 'bg-purple-50 border-purple-200 text-[#4a0b59]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                            <input type="radio" name="audience" className="hidden" checked={audienceType === 'teachers'} onChange={() => {setAudienceType('teachers'); setTargetId('');}} />
                            <Target size={18} className="mr-3" /> <span className="font-bold text-sm">All Teachers</span>
                        </label>

                        {/* Targeted: Specific Subject (Teachers) */}
                        <div className={`p-4 border rounded-xl transition-all ${audienceType === 'subject' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="radio" name="audience" className="hidden" checked={audienceType === 'subject'} onChange={() => {setAudienceType('subject'); setTargetId('');}} />
                                <span className={`font-bold text-sm flex items-center ${audienceType === 'subject' ? 'text-[#4a0b59]' : 'text-gray-700'}`}>Teachers by Subject</span>
                            </label>
                            {audienceType === 'subject' && (
                                <select className="w-full mt-2 p-2 text-sm border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                                    <option value="">Select a subject...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Message Composer */}
                <form onSubmit={handleSendAnnouncement} className="w-full md:w-2/3 p-8 flex flex-col">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">2. Compose Message</h2>
                    
                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Title</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Special Offer for A/L Students!" 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-gray-900 font-bold"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Message</label>
                            <textarea 
                                required
                                className="w-full flex-1 min-h-[250px] p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white resize-none text-gray-700"
                                placeholder="Type the full details of your promotion or announcement here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center text-orange-500 text-xs font-bold">
                            <AlertCircle size={14} className="mr-1" />
                            This will instantly appear in user dashboards.
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 flex items-center shadow-md transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : <><Send size={18} className="mr-2" /> Broadcast Now</>}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default Admin_Announcements;