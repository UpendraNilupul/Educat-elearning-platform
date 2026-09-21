import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, Edit2, TrendingUp, ArrowLeft, CreditCard, History, X, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Admin_Payouts = () => {
    const navigate = useNavigate();
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({ totalGross: 0, systemEarnings: 0, totalToPay: 0 });
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [adjustValue, setAdjustValue] = useState("");

    // Modals
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, payout: null, amount: '', note: '' });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, payout: null, transactions: [], loading: false });
    
    // 🌟 Updated Report Modal State to include customDate
    const [reportModal, setReportModal] = useState({ isOpen: false, type: 'manifest', timeframe: 'all', customDate: '' });
    const [isDownloading, setIsDownloading] = useState(false);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/payouts?month=${selectedMonth}`);
            if (response.data.success) {
                setPayouts(response.data.data || []);
                setStats(response.data.stats || { totalGross: 0, systemEarnings: 0, totalToPay: 0 });
            }
        } catch (error) {
            console.error("Failed to load payouts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isCancelled = false;

        const loadPayouts = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/admin/payouts?month=${selectedMonth}`);
                if (!isCancelled && response.data.success) {
                    setPayouts(response.data.data || []);
                    setStats(response.data.stats || { totalGross: 0, systemEarnings: 0, totalToPay: 0 });
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Failed to load payouts:", error);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        loadPayouts();

        return () => {
            isCancelled = true;
        };
    }, [selectedMonth]);

    const handleSaveAdjustment = async (id) => {
        try {
            const parsed = parseFloat(adjustValue);
            const adjustment = isNaN(parsed) ? 0 : parsed;
            const response = await api.put(`/admin/payouts/${id}/adjust`, { 
                adjustment: adjustment 
            });
            if (response.data.success) {
                setEditingId(null);
                fetchPayouts(); 
            } else {
                alert(response.data.message || "Failed to apply adjustment.");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to apply adjustment.");
        }
    };

    const openPaymentModal = (payout) => {
        const amountPaid = parseFloat(payout.amount_paid || 0);
        const netPayable = parseFloat(payout.net_payable);
        const balance = (netPayable - amountPaid).toFixed(2);
        
        setPaymentModal({ 
            isOpen: true, 
            payout: payout, 
            amount: balance > 0 ? balance : '', 
            note: '' 
        });
    };

    const handleQuickSelect = (percentage) => {
        const amountPaid = parseFloat(paymentModal.payout.amount_paid || 0);
        const netPayable = parseFloat(paymentModal.payout.net_payable);
        const balance = netPayable - amountPaid;
        
        const calculatedAmount = (balance * percentage).toFixed(2);
        setPaymentModal({ ...paymentModal, amount: calculatedAmount });
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/admin/payouts/${paymentModal.payout.id}/pay`, {
                amount: parseFloat(paymentModal.amount),
                referenceNote: paymentModal.note,
                teacherId: paymentModal.payout.teacher_id
            });
            if (response.data.success) {
                setPaymentModal({ isOpen: false, payout: null, amount: '', note: '' });
                fetchPayouts(); 
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to process payment.");
        }
    };

    const openHistoryModal = async (payout) => {
        setHistoryModal({ isOpen: true, payout: payout, transactions: [], loading: true });
        try {
            const response = await api.get(`/admin/payouts/${payout.id}/history`);
            if (response.data.success) {
                setHistoryModal({ isOpen: true, payout: payout, transactions: response.data.data, loading: false });
            }
        } catch (error) {
            alert("Failed to load transaction history.");
            setHistoryModal({ isOpen: false, payout: null, transactions: [], loading: false });
        }
    };

    const downloadReport = async () => {
        // Validation for custom dates
        if (reportModal.timeframe === 'custom_month' && !reportModal.customDate) return alert("Please select a month.");
        if (reportModal.timeframe === 'custom_year' && !reportModal.customDate) return alert("Please enter a year.");

        setIsDownloading(true);
        try {
            const urlReq = `/admin/export/finance?type=${reportModal.type}&timeframe=${reportModal.timeframe}&customDate=${reportModal.customDate}`;
            const response = await api.get(urlReq, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `Educat_${reportModal.type}_report_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            setReportModal({ isOpen: false, type: 'manifest', timeframe: 'all', customDate: '' });
        } catch (error) {
            alert("Failed to download report. Ensure you have Super Admin privileges.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen relative">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Financial Ledger</h1>
                    <p className="text-gray-500 mt-1">Manage teacher earnings, issue payments, and view transaction history.</p>
                </div>
                
                <div className="flex items-center space-x-4">
                    {/* Report Button */}
                    <button 
                        onClick={() => setReportModal({ ...reportModal, isOpen: true })}
                        className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold hover:bg-blue-100 transition-colors shadow-sm"
                    >
                        <Download size={18} className="mr-2" /> Generate Reports
                    </button>

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
            </div>

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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold">Teacher</th>
                            <th className="p-4 font-bold text-right text-gray-400">Base Earnings</th>
                            <th className="p-4 font-bold text-right text-blue-500">+/- Adjustment</th>
                            <th className="p-4 font-bold text-right">Final Net Payable</th>
                            <th className="p-4 font-bold text-right text-green-600">Amount Paid</th>
                            <th className="p-4 font-bold text-right text-red-500">Balance Due</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? <tr><td colSpan="8" className="text-center py-8">Loading Ledger...</td></tr> : 
                         payouts.length === 0 ? <tr><td colSpan="8" className="text-center py-8 text-gray-500">No earnings recorded for this month.</td></tr> :
                         payouts.map(p => {
                            const gross = parseFloat(p.gross_earnings || 0);
                            const fee = parseFloat(p.platform_fee || 0);
                            const baseNet = gross - fee; 
                            
                            const finalNetPayable = parseFloat(p.net_payable);
                            const amountPaid = parseFloat(p.amount_paid || 0);
                            const balanceDue = (finalNetPayable - amountPaid);
                            const status = p.payment_status || (amountPaid >= finalNetPayable ? 'completed' : amountPaid > 0 ? 'partial' : 'unpaid');

                            return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-[#4a0b59] text-white flex items-center justify-center font-bold text-xs">
                                                {p.teacher_name.charAt(0)}
                                            </div>
                                            <span>{p.teacher_name}</span>
                                        </div>
                                    </td>
                                    
                                    <td className="p-4 text-right font-medium text-gray-400">Rs. {baseNet.toFixed(2)}</td>
                                    
                                    <td className="p-4 text-right">
                                        {editingId === p.id ? (
                                            <div className="flex justify-end items-center space-x-2">
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    className="w-20 border rounded px-2 py-1 text-sm text-right outline-none focus:border-[#4a0b59]"
                                                    value={adjustValue}
                                                    onChange={(e) => setAdjustValue(e.target.value)}
                                                />
                                                <button onClick={() => handleSaveAdjustment(p.id)} className="text-green-600 hover:text-green-800"><CheckCircle size={16}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end items-center space-x-2 cursor-pointer group" onClick={() => status !== 'completed' && (setEditingId(p.id), setAdjustValue(p.adjustment))}>
                                                <span className={`font-medium ${p.adjustment > 0 ? 'text-green-500' : p.adjustment < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {p.adjustment > 0 ? '+' : ''}{parseFloat(p.adjustment).toFixed(2)}
                                                </span>
                                                {status !== 'completed' && <Edit2 size={14} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4 text-right font-bold text-gray-900">Rs. {finalNetPayable.toFixed(2)}</td>
                                    <td className="p-4 text-right font-bold text-green-600">Rs. {amountPaid.toFixed(2)}</td>
                                    <td className="p-4 text-right font-bold text-red-500">Rs. {balanceDue > 0 ? balanceDue.toFixed(2) : '0.00'}</td>
                                    
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center w-28 mx-auto
                                            ${status === 'completed' ? 'bg-green-100 text-green-700' : 
                                              status === 'partial' ? 'bg-blue-100 text-blue-700' : 
                                              'bg-orange-100 text-orange-700'}`}
                                        >
                                            {status === 'completed' ? <><CheckCircle size={12} className="mr-1"/> Paid in Full</> : 
                                             status === 'partial' ? <><Clock size={12} className="mr-1"/> Partial</> :
                                             <><Clock size={12} className="mr-1"/> Unpaid</>}
                                        </span>
                                    </td>
                                    
                                    <td className="p-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button 
                                                onClick={() => openHistoryModal(p)}
                                                className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors tooltip"
                                                title="View Ledger"
                                            >
                                                <History size={16} />
                                            </button>
                                            <button 
                                                onClick={() => openPaymentModal(p)}
                                                disabled={balanceDue <= 0}
                                                className="px-3 py-1.5 bg-[#4a0b59] text-white text-xs font-bold rounded-lg hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                            >
                                                <CreditCard size={14} className="mr-1" /> Pay
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* ========================================= */}
            {/* 🌟 REPORTS MODAL */}
            {/* ========================================= */}
            {reportModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50/50">
                            <h3 className="text-lg font-bold text-blue-900 flex items-center">
                                <FileText className="mr-2 text-blue-600" size={20} /> Export Financial Reports
                            </h3>
                            <button onClick={() => setReportModal({ ...reportModal, isOpen: false, customDate: '' })} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Report Document</label>
                                <select 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-800"
                                    value={reportModal.type}
                                    onChange={(e) => setReportModal({ ...reportModal, type: e.target.value })}
                                >
                                    <option value="manifest">Bank Transfer Manifest (Pending Payouts)</option>
                                    <option value="revenue">Student Revenue Audit (Inflows)</option>
                                    <option value="payouts">Teacher Payment Ledger (Outflows)</option>
                                    <option value="profit">Platform Profitability (P&L Summary)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    {reportModal.type === 'manifest' && "Use this document to instruct the finance manager exactly who to pay and how much today."}
                                    {reportModal.type === 'revenue' && "A line-by-line record of every successful student payment made via card or slip."}
                                    {reportModal.type === 'payouts' && "A historical ledger of every individual payout processed to teachers by the administration."}
                                    {reportModal.type === 'profit' && "A high-level monthly breakdown of total volume and the 10% system fees collected."}
                                </p>
                            </div>

                            {reportModal.type !== 'manifest' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Timeframe</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-800"
                                        value={reportModal.timeframe}
                                        onChange={(e) => setReportModal({ ...reportModal, timeframe: e.target.value, customDate: '' })}
                                    >
                                        <option value="all">Lifetime (All Time)</option>
                                        <option value="yearly">This Year</option>
                                        <option value="monthly">This Month</option>
                                        <option value="weekly">Last 7 Days</option>
                                        <option value="custom_month">Specific Month</option>
                                        <option value="custom_year">Specific Year</option>
                                    </select>
                                </div>
                            )}

                            {/* 🌟 Dynamic Inputs for Custom Timeframes */}
                            {(reportModal.timeframe === 'custom_month' || reportModal.timeframe === 'custom_year') && reportModal.type !== 'manifest' && (
                                <div className="animate-in fade-in">
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                        {reportModal.timeframe === 'custom_month' ? 'Select Month' : 'Enter Year'}
                                    </label>
                                    {reportModal.timeframe === 'custom_month' ? (
                                        <input 
                                            type="month" 
                                            className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 font-bold text-blue-800"
                                            value={reportModal.customDate}
                                            onChange={(e) => setReportModal({ ...reportModal, customDate: e.target.value })}
                                        />
                                    ) : (
                                        <input 
                                            type="number" 
                                            min="2020" 
                                            max="2100" 
                                            placeholder="e.g. 2026"
                                            className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 font-bold text-blue-800"
                                            value={reportModal.customDate}
                                            onChange={(e) => setReportModal({ ...reportModal, customDate: e.target.value })}
                                        />
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    onClick={downloadReport}
                                    disabled={isDownloading}
                                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center justify-center disabled:opacity-50"
                                >
                                    {isDownloading ? 'Generating...' : <><Download size={18} className="mr-2" /> Download CSV Report</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* 🌟 PAYMENT MODAL */}
            {/* ========================================= */}
            {paymentModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <CreditCard className="mr-2 text-[#4a0b59]" size={20} /> Issue Payment
                            </h3>
                            <button onClick={() => setPaymentModal({ isOpen: false, payout: null, amount: '', note: '' })} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitPayment} className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-1">Paying Teacher:</p>
                                <p className="font-bold text-gray-900 text-lg">{paymentModal.payout?.teacher_name}</p>
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Amount (Rs.)</label>
                                    
                                    <div className="flex space-x-1">
                                        <button type="button" onClick={() => handleQuickSelect(0.25)} className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">25%</button>
                                        <button type="button" onClick={() => handleQuickSelect(0.50)} className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">50%</button>
                                        <button type="button" onClick={() => handleQuickSelect(1)} className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-[#4a0b59] rounded hover:bg-purple-200">Full</button>
                                    </div>
                                </div>
                                
                                <input 
                                    type="number" 
                                    required 
                                    min="1"
                                    step="0.01"
                                    max={parseFloat(paymentModal.payout?.net_payable) - parseFloat(paymentModal.payout?.amount_paid || 0)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] font-bold text-xl text-gray-900"
                                    value={paymentModal.amount}
                                    onChange={(e) => setPaymentModal({...paymentModal, amount: e.target.value})}
                                />
                                <p className="text-xs text-red-500 mt-2 font-medium">Balance remaining: Rs. {(parseFloat(paymentModal.payout?.net_payable) - parseFloat(paymentModal.payout?.amount_paid || 0)).toFixed(2)}</p>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference Note (Optional)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Cash advance, Bank transfer #123"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium text-gray-700"
                                    value={paymentModal.note}
                                    onChange={(e) => setPaymentModal({...paymentModal, note: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all flex items-center justify-center">
                                <CheckCircle size={18} className="mr-2" /> Record Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* TRANSACTION HISTORY MODAL */}
            {/* ========================================= */}
            {historyModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <History className="mr-2 text-[#4a0b59]" size={20} /> Transaction Ledger
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">History for {historyModal.payout?.teacher_name} ({selectedMonth})</p>
                            </div>
                            <button onClick={() => setHistoryModal({ isOpen: false, payout: null, transactions: [], loading: false })} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            {historyModal.loading ? (
                                <p className="text-center text-gray-500 py-4 font-medium">Loading ledger...</p>
                            ) : historyModal.transactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Clock size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">No payments have been recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyModal.transactions.map((txn, index) => (
                                        <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold text-gray-900 text-lg">Rs. {parseFloat(txn.amount).toFixed(2)}</p>
                                                    <p className="text-xs text-gray-400">{new Date(txn.payment_date).toLocaleString()}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">SUCCESS</span>
                                            </div>
                                            <div className="pt-3 border-t border-gray-50 mt-3 flex justify-between items-center text-sm">
                                                <span className="text-gray-500"><span className="font-medium text-gray-700">Processed by:</span> {txn.admin_name}</span>
                                                {txn.reference_note && <span className="text-gray-500 italic">"{txn.reference_note}"</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Admin_Payouts;