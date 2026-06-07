import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Ticket, Plus, ArrowLeft, CheckCircle, 
    XCircle, Clock, X, Percent
} from 'lucide-react';
import api from '../api';

const Admin_PromoCodes = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    
    const [promos, setPromos] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '', c_id: '', discount_percent: '', expire_date: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [promoRes, courseRes] = await Promise.all([
                api.get('/admin/promo-codes'),
                api.get('/admin/all-courses')
            ]);
            
            const promoData = promoRes.data;
            const courseData = courseRes.data;

            if (promoData.success) setPromos(promoData.data);
            if (courseData.success) setCourses(courseData.data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromo = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/admin/promo-codes', formData);
            const result = response.data;
            
            if (result.success) {
                alert(result.message);
                setIsModalOpen(false);
                setFormData({ code: '', c_id: '', discount_percent: '', expire_date: '' });
                fetchData(); // Refresh the list
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to connect to server.");
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'expired' : 'active';
        try {
            // 🌟 THE FIX: Pass the object directly! No stringify or headers.
            const response = await api.put(`/admin/promo-codes/${id}/status`, { status: newStatus });
            const result = response.data;
            if (result.success) fetchData();
        } catch (error) {
             alert(error.response?.data?.message || "Failed to update status.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <Ticket className="mr-3 text-[#4a0b59]" size={32} /> Marketing & Offers
                    </h1>
                    <p className="text-gray-500 mt-1">Generate and track discount codes for your courses.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 flex items-center shadow-md transition-all"
                >
                    <Plus size={20} className="mr-2" /> Create Promo Code
                </button>
            </div>

            {/* Promo Codes Table */}
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="p-4 font-bold rounded-tl-2xl">Promo Code</th>
                            <th className="p-4 font-bold">Target Course</th>
                            <th className="p-4 font-bold text-center">Discount</th>
                            <th className="p-4 font-bold text-center">Expires On</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center rounded-tr-2xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">Loading codes...</td></tr>
                        ) : promos.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">No promo codes generated yet.</td></tr>
                        ) : (
                            promos.map((promo) => {
                                const isExpiredDate = new Date(promo.expire_date) < new Date();
                                const displayStatus = promo.status === 'expired' || isExpiredDate ? 'expired' : 'active';

                                return (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono font-black text-[#4a0b59] bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 tracking-wider">
                                                {promo.code}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800 text-sm">{promo.course_title}</td>
                                        <td className="p-4 text-center font-black text-green-600">
                                            {(promo.discount_percent * 100).toFixed(0)}%
                                        </td>
                                        <td className="p-4 text-center text-sm font-medium text-gray-600 flex items-center justify-center">
                                            <Clock size={14} className="mr-1 text-gray-400" />
                                            {new Date(promo.expire_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${displayStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {displayStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleToggleStatus(promo.id, promo.status)}
                                                className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors border
                                                    ${promo.status === 'active' 
                                                        ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                                        : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                            >
                                                {promo.status === 'active' ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal: Create Promo Code */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center"><Ticket className="mr-2 text-[#4a0b59]" /> Generate Code</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleCreatePromo} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Promo Code Name</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. ZIRON50" 
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] font-mono uppercase font-bold text-gray-800"
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Course</label>
                                <select 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-sm font-medium"
                                    value={formData.c_id}
                                    onChange={(e) => setFormData({...formData, c_id: e.target.value})}
                                >
                                    <option value="">Select a course...</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Discount %</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            required
                                            min="1" max="100"
                                            placeholder="50" 
                                            className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-bold"
                                            value={formData.discount_percent}
                                            onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                                        />
                                        <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium text-sm"
                                        value={formData.expire_date}
                                        onChange={(e) => setFormData({...formData, expire_date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 mt-6">
                                <button type="submit" className="w-full py-3 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 shadow-sm transition-colors">
                                    Save Promo Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin_PromoCodes;