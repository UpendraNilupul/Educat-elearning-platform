import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, BookOpen, CreditCard, ShieldAlert, 
    Mail, CheckCircle, Clock, XCircle, Gift
} from 'lucide-react';
import api from '../api';

const Admin_StudentProfile = ({ userName, onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [isMessageOpen, setIsMessageOpen] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        try {
            const response = await api.get(`/admin/student-profile/${id}`);
            const result = response.data;
            if (result.success) setData(result);
            else navigate('/admin/students');
        } catch (error) {
            console.error("Failed to load student:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = data.profile.status === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus} this student?`)) return;

        try {
            const response = await api.put(`/admin/student-status/${data.profile.user_id}`);
            const result = response.data;
            if (result.success) {
                setData(prev => ({ ...prev, profile: { ...prev.profile, status: newStatus } }));
            }
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        try {
            const response = await api.post('/admin/student-notify');
            const result = response.data;
            if (result.success) {
                alert("Message sent!");
                setMessageText('');
                setIsMessageOpen(false);
            }
        } catch (error) {
            alert("Failed to send message.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading Student Data...</div>;
    if (!data) return null;

    const { profile, enrollments, payments } = data;
    const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const API_BASE = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : 'http://localhost:3000';

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            {/* Header & Navigation */}
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <button 
                    onClick={() => navigate('/admin/students')}
                    className="flex items-center text-gray-500 hover:text-blue-600 font-bold transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Directory
                </button>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setIsMessageOpen(!isMessageOpen)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 flex items-center shadow-sm"
                    >
                        <Mail size={16} className="mr-2" /> Send Message
                    </button>
                    <button 
                        onClick={handleToggleStatus}
                        className={`px-4 py-2 font-bold rounded-xl flex items-center shadow-sm transition-colors ${
                            profile.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                    >
                        <ShieldAlert size={16} className="mr-2" /> 
                        {profile.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                    </button>
                </div>
            </div>

            {/* Quick Message Box */}
            {isMessageOpen && (
                <div className="max-w-6xl mx-auto mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                    <textarea 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                        rows="3"
                        placeholder={`Type a direct notification to ${profile.name}...`}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                    ></textarea>
                    <button onClick={handleSendMessage} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                        Send Notification
                    </button>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* 1. Profile Overview Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-4xl shrink-0 overflow-hidden">
                            {profile.picture ? (
                                <img src={`${API_BASE}/uploads/${profile.picture}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : profile.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <h1 className="text-3xl font-black text-gray-900">{profile.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                    ${profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {profile.status}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium mb-3">{profile.email} • {profile.phone_number}</p>
                            <p className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg inline-block border border-gray-200">
                                {profile.grade_level || 'Grade N/A'} • {profile.school_name || 'School N/A'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-500 font-medium">
                        <p className="mb-2">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
                        <p>Last Login: {profile.last_active ? new Date(profile.last_active).toLocaleDateString() : 'Never'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* 2. Enrollments Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center"><BookOpen className="mr-2 text-blue-600" size={20}/> Course Enrollments</h2>
                            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">{enrollments.length} Total</span>
                        </div>
                        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                            {enrollments.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No active enrollments.</p>
                            ) : (
                                enrollments.map(course => (
                                    <div key={course.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-800">{course.course_title}</h3>
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md
                                                ${course.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {course.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">Teacher: {course.teacher_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Enrolled: {new Date(course.enrolled_date).toLocaleDateString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 3. Payment History Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center"><CreditCard className="mr-2 text-green-600" size={20}/> Payment History</h2>
                            <span className="bg-green-50 text-green-600 text-sm font-bold px-3 py-1 rounded-lg border border-green-100">Total Spent: ${totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-bold">Course / Item</th>
                                        <th className="p-4 font-bold text-center">Date</th>
                                        <th className="p-4 font-bold text-center">Status</th>
                                        <th className="p-4 font-bold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payments.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">No payment history found.</td></tr>
                                    ) : (
                                        payments.map(payment => (
                                            <tr key={payment.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-bold text-sm text-gray-800 max-w-[200px] truncate">{payment.course_title}</td>
                                                <td className="p-4 text-xs text-gray-500 text-center">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                                <td className="p-4 text-center">
                                                    {payment.status === 'paid' ? <CheckCircle size={16} className="text-green-500 mx-auto" /> : 
                                                     payment.status === 'failed' ? <XCircle size={16} className="text-red-500 mx-auto" /> : 
                                                     <Clock size={16} className="text-orange-500 mx-auto" />}
                                                </td>
                                                <td className="p-4 font-black text-gray-900 text-right">${parseFloat(payment.amount).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Grant Offer Button Area */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                <Gift size={16} className="mr-2" /> Grant Promo Code / Discount Offer
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Admin_StudentProfile;