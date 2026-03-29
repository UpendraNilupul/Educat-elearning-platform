import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, IdCard } from 'lucide-react';

const TeacherReview = ({ userName, onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch the real data from the database
    useEffect(() => {
        const fetchTeacherDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/teacher-details/${id}`, {
                    credentials: 'include'
                });
                const result = await response.json();
                
                if (result.success) {
                    setTeacher(result.data);
                } else {
                    alert(result.message);
                    navigate('/admin/teachers');
                }
            } catch (error) {
                console.error("Failed to load teacher details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherDetails();
    }, [id, navigate]);

    // Handle the button clicks (Approve, Reject, Pending)
    const handleVerifyAction = async (newStatus) => {
        if (newStatus === 'rejected' && !feedback.trim()) {
            alert("You must provide feedback if you are rejecting an application.");
            return;
        }

        if (!window.confirm(`Are you sure you want to mark this application as ${newStatus}?`)) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:3000/api/admin/verify-teacher/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, message: feedback }),
                credentials: 'include'
            });

            const result = await response.json();
            if (result.success) {
                alert(`Success! Application ${newStatus}.`);
                navigate('/admin/teachers'); // Send them back to the directory
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading Application Data...</div>;
    if (!teacher) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <button 
                    onClick={() => navigate('/admin/teachers')}
                    className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Directory
                </button>
                <div className="text-gray-500 text-sm font-medium">
                    Logged in as admin
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Teacher Data */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center space-x-6 mb-8">
                            <div className="w-24 h-24 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 font-black text-4xl shrink-0 overflow-hidden">
                                {teacher.picture ? (
                                    <img src={`http://localhost:3000/uploads/${teacher.picture}`} alt="Avatar" className="w-full h-full object-cover" />
                                ) : teacher.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center space-x-3 mb-1">
                                    <h1 className="text-3xl font-black text-gray-900">{teacher.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                        ${teacher.verification_status === 'approved' ? 'bg-green-100 text-green-700' : 
                                          teacher.verification_status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                                          'bg-red-100 text-red-700'}`}>
                                        {teacher.verification_status}
                                    </span>
                                </div>
                                <p className="text-gray-500 font-medium">{teacher.email} • {teacher.phone_number}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-50">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                                <p className="font-semibold text-gray-900">{new Date(teacher.dob).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                                <p className="font-semibold text-gray-900 capitalize">{teacher.gender}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                                <p className="font-semibold text-gray-900">{teacher.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Qualifications & Documents Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Submitted Documents & Experience</h2>
                        
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Self-Reported Qualification & Bio</p>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 text-sm">
                                <p className="font-bold mb-2">{teacher.highest_qualification || 'No qualification listed'}</p>
                                <p className="mb-2"><strong>University:</strong> {teacher.university || 'N/A'}</p>
                                <p className="mb-2"><strong>Experience:</strong> {teacher.experience_years ? `${teacher.experience_years} years` : 'N/A'}</p>
                                <p className="italic text-gray-500 mt-4 border-t border-gray-200 pt-4">"{teacher.bio || 'No bio provided.'}"</p>
                            </div>
                        </div>

                        {/* 🌟 NEW: Grid for Multiple Documents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Document 1: CV */}
                            <a 
                                href={teacher.resume_link ? (teacher.resume_link.startsWith('http') ? teacher.resume_link : `http://localhost:3000/uploads/verification/${teacher.resume_link}`) : '#'} 
                                target="_blank" rel="noreferrer"
                                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all
                                    ${teacher.resume_link ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer' : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'}`}
                            >
                                <FileText className={`mb-2 ${teacher.resume_link ? 'text-[#4a0b59]' : 'text-gray-400'}`} size={32} />
                                <span className="font-bold text-gray-800 text-center">Curriculum Vitae (CV)</span>
                                <span className="text-xs text-gray-500 mt-1">{teacher.resume_link ? 'Click to view document' : 'No CV uploaded'}</span>
                            </a>

                            {/* Document 2: NIC */}
                            <a 
                                href={teacher.nic_path ? (teacher.nic_path.startsWith('http') ? teacher.nic_path : `http://localhost:3000/uploads/verification/${teacher.nic_path}`) : '#'} 
                                target="_blank" rel="noreferrer"
                                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all
                                    ${teacher.nic_path ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer' : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'}`}
                            >
                                <IdCard className={`mb-2 ${teacher.nic_path ? 'text-[#4a0b59]' : 'text-gray-400'}`} size={32} />
                                <span className="font-bold text-gray-800 text-center">National ID Card</span>
                                <span className="text-xs text-gray-500 mt-1">{teacher.nic_path ? 'Click to view image' : 'No NIC uploaded'}</span>
                            </a>

                        </div>
                    </div>
                </div>

                {/* Right Column: Admin Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col h-fit sticky top-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Decision</h2>
                    
                    <div className="mb-6 flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Feedback to Teacher <span className="text-red-400 normal-case">(Required for Rejection)</span>
                        </label>
                        <textarea 
                            className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 resize-none text-sm"
                            placeholder="Detail what is missing or explain why they are approved..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => handleVerifyAction('approved')}
                            disabled={isSubmitting}
                            className="w-full py-3 bg-[#00c853] text-white font-bold rounded-xl hover:bg-green-600 flex items-center justify-center shadow-sm disabled:opacity-50 transition-colors"
                        >
                            <CheckCircle size={18} className="mr-2" /> Approve Application
                        </button>
                        
                        <button 
                            onClick={() => handleVerifyAction('rejected')}
                            disabled={isSubmitting}
                            className="w-full py-3 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-100 flex items-center justify-center disabled:opacity-50 transition-colors"
                        >
                            <XCircle size={18} className="mr-2" /> Reject Application
                        </button>

                        <button 
                            onClick={() => handleVerifyAction('pending')}
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 transition-colors"
                        >
                            <Clock size={18} className="mr-2" /> Request More Info (Keep Pending)
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeacherReview;