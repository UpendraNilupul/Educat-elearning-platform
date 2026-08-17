import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, FileText, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Admin_SlipApprovals = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/pending-payments');
            if (response.data.success) {
                setPayments(response.data.data);
            }
        } catch (error) {
            console.error("Failed to load pending payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm("Are you sure you want to approve this payment and enroll the student?")) return;
        setIsProcessing(true);
        try {
            const res = await api.put(`/admin/payments/${id}/approve`);
            if (res.data.success) {
                alert("Payment approved successfully!");
                fetchPendingPayments();
            }
        } catch (error) {
            alert("Failed to approve payment.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this payment?")) return;
        setIsProcessing(true);
        try {
            const res = await api.put(`/admin/payments/${id}/reject`);
            if (res.data.success) {
                alert("Payment rejected.");
                fetchPendingPayments();
            }
        } catch (error) {
            alert("Failed to reject payment.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredPayments = payments.filter(p => 
        p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Bank Slip Approvals</h1>
                    <p className="text-gray-500 mt-1">Review and approve manual bank transfer payments from students.</p>
                </div>
                
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search student or course..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a0b59]/20 focus:border-[#4a0b59] transition-all w-64 shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold">Student</th>
                            <th className="p-4 font-bold">Class / Course</th>
                            <th className="p-4 font-bold">Amount</th>
                            <th className="p-4 font-bold">Date Submitted</th>
                            <th className="p-4 font-bold text-center">Slip Image</th>
                            <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr> : 
                         filteredPayments.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-gray-500">No pending slip payments found.</td></tr> :
                         filteredPayments.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <p className="font-bold text-gray-900">{p.student_name}</p>
                                    <p className="text-xs text-gray-500">{p.student_email}</p>
                                </td>
                                <td className="p-4 font-medium text-gray-800">{p.course_title}</td>
                                <td className="p-4 font-black text-[#4a0b59]">LKR {parseFloat(p.amount).toFixed(2)}</td>
                                <td className="p-4 text-sm text-gray-500">{new Date(p.payment_date).toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => setSelectedImage(p.slip_url)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <ImageIcon size={14} /> View Slip
                                    </button>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleApprove(p.id)}
                                            disabled={isProcessing}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                            title="Approve"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                        <button 
                                            onClick={() => handleReject(p.id)}
                                            disabled={isProcessing}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                            title="Reject"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-screen" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2 font-bold"
                        >
                            <X size={24} /> Close
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Bank Slip" 
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-white"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin_SlipApprovals;
