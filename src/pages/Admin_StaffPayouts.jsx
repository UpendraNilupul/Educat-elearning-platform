import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Clock, Edit2, ArrowLeft, CreditCard, History, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Admin_StaffPayouts = () => {
    const navigate = useNavigate();
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({ totalSalaries: 0, totalAdjustments: 0, totalToPay: 0 });
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ baseSalary: "", adjustment: "" });

    // Modals
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, payout: null, amount: '', note: '' });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, payout: null, transactions: [], loading: false });

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/staff-payouts?month=${selectedMonth}`);
            if (response.data.success) {
                setPayouts(response.data.data);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error("Failed to load staff payouts:", error);
            if (error.response?.status === 403) navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [selectedMonth]);

    const handleSavePayroll = async (id) => {
        try {
            const response = await api.put(`/admin/staff-payouts/${id}/update`, { 
                base_salary: parseFloat(editData.baseSalary) || 0,
                adjustment: parseFloat(editData.adjustment) || 0 
            });
            if (response.data.success) {
                setEditingId(null);
                fetchPayouts(); 
            }
        } catch (error) {
            alert("Failed to update payroll.");
        }
    };

    const openPaymentModal = (payout) => {
        const amountPaid = parseFloat(payout.amount_paid || 0);
        const netPayable = parseFloat(payout.net_payable);
        const balance = (netPayable - amountPaid).toFixed(2);
        setPaymentModal({ isOpen: true, payout: payout, amount: balance > 0 ? balance : '', note: '' });
    };

    const handleQuickSelect = (percentage) => {
        const amountPaid = parseFloat(paymentModal.payout.amount_paid || 0);
        const netPayable = parseFloat(paymentModal.payout.net_payable);
        const balance = netPayable - amountPaid;
        setPaymentModal({ ...paymentModal, amount: (balance * percentage).toFixed(2) });
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/admin/staff-payouts/${paymentModal.payout.id}/pay`, {
                amount: parseFloat(paymentModal.amount),
                referenceNote: paymentModal.note,
                subAdminId: paymentModal.payout.sub_admin_id
            });
            if (response.data.success) {
                setPaymentModal({ isOpen: false, payout: null, amount: '', note: '' });
                fetchPayouts(); 
            }
        } catch (error) {
            alert("Failed to process payment.");
        }
    };

    const openHistoryModal = async (payout) => {
        setHistoryModal({ isOpen: true, payout: payout, transactions: [], loading: true });
        try {
            const response = await api.get(`/admin/staff-payouts/${payout.id}/history`);
            if (response.data.success) {
                setHistoryModal({ isOpen: true, payout: payout, transactions: response.data.data, loading: false });
            }
        } catch (error) {
            alert("Failed to load history.");
            setHistoryModal({ isOpen: false, payout: null, transactions: [], loading: false });
        }
    };

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen relative">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Staff Payroll</h1>
                    <p className="text-gray-500 mt-1">Manage monthly salaries and process payments for Sub-Admins.</p>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Briefcase size={24} /></div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold">Total Base Salaries</p>
                        <h3 className="text-2xl font-black">Rs. {stats.totalSalaries.toFixed(2)}</h3>
                    </div>
                </div>
                <div className="bg-[#4a0b59] p-6 rounded-2xl shadow-md flex items-center space-x-4 md:col-start-3">
                    <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-purple-200 font-bold">Total Payable to Staff</p>
                        <h3 className="text-2xl font-black text-white">Rs. {stats.totalToPay.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold">Sub-Admin</th>
                            <th className="p-4 font-bold text-right text-blue-600">Base Salary</th>
                            <th className="p-4 font-bold text-right text-orange-500">+/- Bonus/Penalty</th>
                            <th className="p-4 font-bold text-right">Final Net Payable</th>
                            <th className="p-4 font-bold text-right text-green-600">Amount Paid</th>
                            <th className="p-4 font-bold text-right text-red-500">Balance Due</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? <tr><td colSpan="8" className="text-center py-8">Loading Ledger...</td></tr> : 
                         payouts.length === 0 ? <tr><td colSpan="8" className="text-center py-8 text-gray-500">No staff found for this month.</td></tr> :
                         payouts.map(p => {
                            const baseSalary = parseFloat(p.base_salary || 0);
                            const finalNetPayable = parseFloat(p.net_payable);
                            const amountPaid = parseFloat(p.amount_paid || 0);
                            const balanceDue = (finalNetPayable - amountPaid);
                            const status = p.payment_status || 'unpaid';

                            return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                {p.admin_name.charAt(0)}
                                            </div>
                                            <span>{p.admin_name}</span>
                                        </div>
                                    </td>
                                    
                                    {/* Editable Base Salary & Adjustment Column combined logic */}
                                    {editingId === p.id ? (
                                        <>
                                            <td className="p-4">
                                                <input type="number" className="w-24 border rounded px-2 py-1 text-sm outline-none" value={editData.baseSalary} onChange={(e) => setEditData({...editData, baseSalary: e.target.value})} placeholder="Salary" />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2">
                                                    <input type="number" className="w-20 border rounded px-2 py-1 text-sm outline-none" value={editData.adjustment} onChange={(e) => setEditData({...editData, adjustment: e.target.value})} placeholder="Bonus" />
                                                    <button onClick={() => handleSavePayroll(p.id)} className="text-green-600 hover:text-green-800"><Save size={16}/></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-4 text-right font-medium text-blue-700">Rs. {baseSalary.toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end items-center space-x-2 cursor-pointer group" onClick={() => setEditingId(p.id) || setEditData({ baseSalary: p.base_salary, adjustment: p.adjustment })}>
                                                    <span className={`font-medium ${p.adjustment > 0 ? 'text-green-500' : p.adjustment < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {p.adjustment > 0 ? '+' : ''}{parseFloat(p.adjustment).toFixed(2)}
                                                    </span>
                                                    <Edit2 size={14} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </td>
                                        </>
                                    )}

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
                                            <button onClick={() => openHistoryModal(p)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="View Ledger">
                                                <History size={16} />
                                            </button>
                                            <button onClick={() => openPaymentModal(p)} disabled={balanceDue <= 0 || finalNetPayable <= 0} className="px-3 py-1.5 bg-[#4a0b59] text-white text-xs font-bold rounded-lg hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
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

            {/* PAYMENT MODAL */}
            {paymentModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <CreditCard className="mr-2 text-[#4a0b59]" size={20} /> Issue Staff Payment
                            </h3>
                            <button onClick={() => setPaymentModal({ isOpen: false, payout: null, amount: '', note: '' })} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitPayment} className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-1">Paying Staff Member:</p>
                                <p className="font-bold text-gray-900 text-lg">{paymentModal.payout?.admin_name}</p>
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Amount (Rs.)</label>
                                    <div className="flex space-x-1">
                                        <button type="button" onClick={() => handleQuickSelect(0.50)} className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">50%</button>
                                        <button type="button" onClick={() => handleQuickSelect(1)} className="text-[10px] font-bold px-2 py-1 bg-purple-100 text-[#4a0b59] rounded hover:bg-purple-200">Full</button>
                                    </div>
                                </div>
                                <input type="number" required min="1" step="0.01" max={parseFloat(paymentModal.payout?.net_payable) - parseFloat(paymentModal.payout?.amount_paid || 0)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#4a0b59] font-bold text-xl text-gray-900" value={paymentModal.amount} onChange={(e) => setPaymentModal({...paymentModal, amount: e.target.value})} />
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference Note</label>
                                <input type="text" placeholder="e.g., August Base Salary" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={paymentModal.note} onChange={(e) => setPaymentModal({...paymentModal, note: e.target.value})} />
                            </div>

                            <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md">
                                Record Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* HISTORY MODAL */}
            {historyModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center"><History className="mr-2 text-[#4a0b59]" size={20} /> Ledger</h3>
                                <p className="text-sm text-gray-500 mt-1">History for {historyModal.payout?.admin_name} ({selectedMonth})</p>
                            </div>
                            <button onClick={() => setHistoryModal({ isOpen: false })} className="text-gray-400"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            {historyModal.loading ? <p className="text-center text-gray-500">Loading...</p> : historyModal.transactions.length === 0 ? <p className="text-center text-gray-500 py-8">No payments recorded.</p> : (
                                <div className="space-y-4">
                                    {historyModal.transactions.map((txn, index) => (
                                        <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold text-gray-900 text-lg">Rs. {parseFloat(txn.amount).toFixed(2)}</p>
                                                    <p className="text-xs text-gray-400">{new Date(txn.payment_date).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-gray-50 mt-3 flex justify-between items-center text-sm text-gray-500">
                                                <span>Processed by: {txn.processor_name}</span>
                                                {txn.reference_note && <span className="italic">"{txn.reference_note}"</span>}
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

export default Admin_StaffPayouts;