import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, Edit2, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Admin_Payouts = () => {
    const navigate = useNavigate();
    
    // Default to current month (YYYY-MM)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({ totalGross: 0, systemEarnings: 0, totalToPay: 0 });
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [adjustValue, setAdjustValue] = useState("");

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/payouts?month=${selectedMonth}`);
            if (response.data.success) {
                setPayouts(response.data.data);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to load payouts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [selectedMonth]);

    const handleSaveAdjustment = async (id) => {
        try {
            const response = await api.put(`/admin/payouts/${id}/adjust`, { 
                adjustment: parseFloat(adjustValue) || 0 
            });
            if (response.data.success) {
                setEditingId(null);
                fetchPayouts(); // Refresh to recalculate net payable
            }
        } catch (error) {
            alert("Failed to apply adjustment.");
        }
    };

    const handleProcessPayments = async () => {
        if (!window.confirm(`Are you sure you want to process all pending payments for ${selectedMonth}?`)) return;

        try {
            const response = await api.post('/admin/payouts/process', { monthYear: selectedMonth });
            if (response.data.success) {
                alert("✅ Payments processed successfully!");
                fetchPayouts(); // Refresh to show 'Paid' status
            }
        } catch (error) {
            alert("Failed to process payments.");
        }
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Financial Payouts</h1>
                    <p className="text-gray-500 mt-1">Manage teacher earnings, platform fees, and monthly disbursements.</p>
                </div>
                
                {/* Month Picker */}
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                    <label className="text-xs font-bold text-gray-400 uppercase mr-3">Select Month:</label>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="outline-none font-bold text-[#4a0b59] bg-transparent cursor-pointer"
                    />
                </div>
            </div>

            {/* Master Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">Total Gross Volume</p>
                        <h3 className="text-2xl font-black">Rs. {stats.totalGross.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-sm text-orange-500 font-bold">System Earnings (10% Cut)</p>
                        <h3 className="text-2xl font-black text-orange-600">+ Rs. {stats.systemEarnings.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-[#4a0b59] p-6 rounded-2xl shadow-md flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-purple-200 font-bold">Total Payable to Teachers</p>
                        <h3 className="text-2xl font-black text-white">Rs. {stats.totalToPay.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold">Teacher</th>
                            <th className="p-4 font-bold text-right">Gross Earned</th>
                            <th className="p-4 font-bold text-right text-orange-500">- 10% Fee</th>
                            <th className="p-4 font-bold text-right text-blue-500">+/- Adjustment</th>
                            <th className="p-4 font-bold text-right text-green-600">Net Payable</th>
                            <th className="p-4 font-bold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr> : 
                         payouts.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-gray-500">No earnings recorded for this month.</td></tr> :
                         payouts.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{p.teacher_name}</td>
                                <td className="p-4 text-right text-gray-500">Rs. {parseFloat(p.gross_earnings).toFixed(2)}</td>
                                <td className="p-4 text-right text-orange-500">-Rs. {parseFloat(p.platform_fee).toFixed(2)}</td>
                                
                                {/* Editable Adjustment Column */}
                                <td className="p-4 text-right">
                                    {editingId === p.id ? (
                                        <div className="flex justify-end items-center space-x-2">
                                            <input 
                                                type="number" 
                                                className="w-20 border rounded px-2 py-1 text-sm text-right"
                                                value={adjustValue}
                                                onChange={(e) => setAdjustValue(e.target.value)}
                                            />
                                            <button onClick={() => handleSaveAdjustment(p.id)} className="text-green-600 hover:text-green-800"><CheckCircle size={16}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end items-center space-x-2 cursor-pointer group" onClick={() => p.status === 'pending' && (setEditingId(p.id), setAdjustValue(p.adjustment))}>
                                            <span className={`font-medium ${p.adjustment > 0 ? 'text-green-500' : p.adjustment < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {p.adjustment > 0 ? '+' : ''}{parseFloat(p.adjustment).toFixed(2)}
                                            </span>
                                            {p.status === 'pending' && <Edit2 size={14} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </div>
                                    )}
                                </td>

                                <td className="p-4 text-right font-black text-green-600">Rs. {parseFloat(p.net_payable).toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center w-24 mx-auto ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {p.status === 'paid' ? <><CheckCircle size={12} className="mr-1"/> Paid</> : <><Clock size={12} className="mr-1"/> Pending</>}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end">
                <button 
                    onClick={handleProcessPayments}
                    disabled={payouts.length === 0 || !payouts.some(p => p.status === 'pending')}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                    <DollarSign size={20} className="mr-2" />
                    Process All Pending Payments
                </button>
            </div>
        </div>
    );
};

export default Admin_Payouts;