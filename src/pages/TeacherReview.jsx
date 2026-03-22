import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Award, CheckCircle, XCircle, Clock } from 'lucide-react';

const TeacherReview = ({ userName, onLogout }) => {
    const { id } = useParams(); // Grabs the teacher ID from the URL
    const navigate = useNavigate();
    
    const [teacher, setTeacher] = useState(null);
    const [history, setHistory] = useState([]);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/teacher-details/${id}`, { credentials: 'include' });
                const data = await response.json();
                if (data.success) {
                    setTeacher(data.data);
                    setHistory(data.history);
                } else {
                    alert("Teacher not found");
                    navigate('/admin');
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherData();
    }, [id, navigate]);

    const handleSubmitDecision = async (status) => {
        if (!window.confirm(`Are you sure you want to mark this application as ${status}?`)) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/verify-teacher/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, message: feedbackMsg }),
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                alert(`Teacher has been ${status}!`);
                navigate('/admin'); // Send admin back to dashboard
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Failed to submit decision.");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">Loading Application...</div>;
    if (!teacher) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/admin')}
                    className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>
                <div className="flex items-center space-x-3">
                    <span className="text-gray-500 font-medium">Logged in as {userName}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Teacher Details & Documents */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Profile Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-start space-x-6">
                        <div className="w-24 h-24 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 font-black text-4xl shrink-0">
                            {teacher.picture ? (
                                <img src={`http://localhost:3000/uploads/${teacher.picture}`} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                teacher.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <h1 className="text-3xl font-black text-gray-900">{teacher.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${teacher.verification_status === 'approved' ? 'bg-green-100 text-green-700' : 
                                      teacher.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                      'bg-orange-100 text-orange-700'}`}>
                                    {teacher.verification_status}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium mb-4">{teacher.email} • {teacher.phone_number}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px]">Date of Birth</p>
                                    <p className="font-semibold text-gray-800">{new Date(teacher.dob).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px]">Gender</p>
                                    <p className="font-semibold text-gray-800 capitalize">{teacher.gender}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 font-bold uppercase text-[10px]">Address</p>
                                    <p className="font-semibold text-gray-800">{teacher.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Section (Ready for Future File Uploads) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Submitted Documents</h2>
                        
                        <div className="mb-6">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Self-Reported Qualification</p>
                            <p className="text-lg font-medium text-gray-800 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                {teacher.highest_qualification || "No qualification text provided."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Placeholder for CV PDF */}
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                <FileText className="text-gray-400 mb-2" size={32} />
                                <p className="font-bold text-gray-700">Curriculum Vitae (CV)</p>
                                <p className="text-xs text-gray-400 mt-1">Click to view PDF document</p>
                            </div>
                            
                            {/* Placeholder for Certificates */}
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                <Award className="text-gray-400 mb-2" size={32} />
                                <p className="font-bold text-gray-700">Degree / Certificates</p>
                                <p className="text-xs text-gray-400 mt-1">2 files attached</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Feedback & Actions */}
                <div className="space-y-6 flex flex-col h-full">
                    
                    {/* Action Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Decision</h2>
                        
                        <div className="flex-1 flex flex-col mb-6">
                            <label className="text-sm font-bold text-gray-700 mb-2">Feedback to Teacher (Required for Rejection)</label>
                            <textarea 
                                className="w-full flex-1 min-h-[150px] p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] resize-none"
                                placeholder="Detail what is missing or explain why they are approved..."
                                value={feedbackMsg}
                                onChange={(e) => setFeedbackMsg(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={() => handleSubmitDecision('approved')}
                                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center"
                            >
                                <CheckCircle size={18} className="mr-2" /> Approve Application
                            </button>
                            <button 
                                onClick={() => handleSubmitDecision('rejected')}
                                className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center"
                            >
                                <XCircle size={18} className="mr-2" /> Reject Application
                            </button>
                            <button 
                                onClick={() => handleSubmitDecision('pending')}
                                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center"
                            >
                                <Clock size={18} className="mr-2" /> Request More Info (Keep Pending)
                            </button>
                        </div>
                    </div>

                    {/* Review History */}
                    {history.length > 0 && (
                        <div className="bg-gray-900 rounded-2xl shadow-sm p-6 text-white">
                            <h3 className="font-bold mb-4 flex items-center"><Clock size={16} className="mr-2" /> Review History</h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {history.map((log, index) => (
                                    <div key={index} className="border-l-2 border-gray-700 pl-4 pb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                log.status === 'approved' ? 'text-green-400' : 
                                                log.status === 'rejected' ? 'text-red-400' : 'text-orange-400'
                                            }`}>
                                                Marked as {log.status}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 italic">"{log.feedback || "No feedback provided."}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherReview;