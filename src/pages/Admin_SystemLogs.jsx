import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Activity, ArrowLeft, Search, Clock, ShieldCheck, ShieldAlert
} from 'lucide-react';

const Admin_SystemLogs = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/admin/system-logs', { credentials: 'include' });
                const data = await response.json();
                if (data.success) {
                    setLogs(data.data);
                } else {
                    navigate('/admin'); // Boot sub-admins out if they try to access this
                }
            } catch (error) {
                console.error("Failed to load logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [navigate]);

    const filteredLogs = logs.filter(log => 
        log.admin_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.action_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-blue-600 font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <Activity className="mr-3 text-blue-600" size={32} /> Global Audit Logs
                    </h1>
                    <p className="text-gray-500 mt-1">A permanent, chronological record of all administrative actions.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by admin name or action..." 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-bold pl-8">Timestamp</th>
                                <th className="p-4 font-bold">Administrator</th>
                                <th className="p-4 font-bold">Clearance Level</th>
                                <th className="p-4 font-bold">Action Performed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-500 font-bold">Loading system logs...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-500">No logs found matching your search.</td></tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-4 pl-8 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            <div className="flex items-center">
                                                <Clock size={14} className="mr-2 text-gray-400" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-gray-900">{log.admin_name}</p>
                                            <p className="text-xs text-gray-500">{log.admin_email}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${log.admin_level === 'super' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {log.admin_level === 'super' ? <ShieldCheck size={12} className="mr-1" /> : <ShieldAlert size={12} className="mr-1" />}
                                                {log.admin_level} Admin
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-gray-800 font-medium bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-100">
                                                {log.action_type}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin_SystemLogs;