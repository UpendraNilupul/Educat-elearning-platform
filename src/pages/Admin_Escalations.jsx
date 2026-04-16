import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldAlert, ArrowLeft, CheckCircle, Clock, 
    User, BookOpen, AlertTriangle
} from 'lucide-react';

const Admin_Escalations = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const [escalations, setEscalations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEscalations();
    }, []);

    const fetchEscalations = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/escalations', { credentials: 'include' });
            const data = await response.json();
            if (data.success) {
                setEscalations(data.data);
            }
        } catch (error) {
            console.error("Failed to load escalations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!window.confirm("Mark this issue as resolved?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/resolve-escalation/${id}`, {
                method: 'PUT',
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.success) {
                // Update UI instantly
                setEscalations(escalations.map(esc => 
                    esc.id === id ? { ...esc, status: 'resolved' } : esc
                ));
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("Failed to resolve issue.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Loading Inbox...</div>;

    const pendingCount = escalations.filter(e => e.status === 'pending').length;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <ShieldAlert className="mr-3 text-red-500" size={32} /> Escalation Inbox
                    </h1>
                    <p className="text-gray-500 mt-1">Review and resolve severe issues flagged by your Moderation Team.</p>
                </div>
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold border border-red-100 flex items-center shadow-sm">
                    <AlertTriangle size={18} className="mr-2" /> {pendingCount} Pending Issues
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-4">
                {escalations.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm flex flex-col items-center">
                        <CheckCircle size={48} className="text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Inbox Zero</h3>
                        <p className="text-gray-500">Your moderation team hasn't escalated any issues yet.</p>
                    </div>
                ) : (
                    escalations.map((issue) => (
                        <div key={issue.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${issue.status === 'pending' ? 'border-red-100' : 'border-gray-100 opacity-75'}`}>
                            
                            {/* Card Header */}
                            <div className={`px-6 py-3 flex justify-between items-center border-b ${issue.status === 'pending' ? 'bg-red-50/50 border-red-50' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${issue.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {issue.status}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center">
                                        <Clock size={12} className="mr-1" /> {new Date(issue.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-gray-700">
                                    Reported by: <span className="text-[#4a0b59]">{issue.sub_admin_name}</span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        {issue.entity_type === 'course' ? <BookOpen size={16} className="text-gray-400" /> : <User size={16} className="text-gray-400" />}
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            Flagged {issue.entity_type} (ID: {issue.entity_id})
                                        </h3>
                                    </div>
                                    <p className="text-gray-800 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        "{issue.reason}"
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-2 w-full md:w-auto shrink-0">
                                    {issue.status === 'pending' && (
                                        <button 
                                            onClick={() => handleResolve(issue.id)}
                                            className="px-6 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 flex items-center justify-center transition-colors shadow-sm"
                                        >
                                            <CheckCircle size={18} className="mr-2" /> Mark as Resolved
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => navigate(`/admin/${issue.entity_type}s`)}
                                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
                                    >
                                        Go to {issue.entity_type}s
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Admin_Escalations;