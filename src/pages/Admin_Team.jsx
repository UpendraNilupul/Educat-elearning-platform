import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, Lock, UserPlus, ArrowLeft, 
    AlertTriangle, CheckCircle, Mail, Phone, MapPin, Calendar, Users, Shield, Trash2, UserX, UserCheck
} from 'lucide-react';
import api from '../api';

const Admin_Team = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    
    const [adminLevel, setAdminLevel] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    
    // UI State
    const [view, setView] = useState('list'); // 'list' or 'add'
    
    // Team List State
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phoneNumber: '', 
        address: '', dob: '', gender: ''
    });
    const [errors, setErrors] = useState({});

    // 1. Verify Clearance
    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const response = await api.get('/status');
                const data = response.data;
                if (data.isLoggedIn) {
                    setAdminLevel(data.adminLevel);
                }
            } catch (error) {
                console.error("Access verification failed.");
            } finally {
                setIsChecking(false);
            }
        };
        verifyAccess();
    }, []);

    // 2. Fetch Team Members
    const fetchTeam = async () => {
        setLoadingTeam(true);
        try {
            const response = await api.get('/admin/sub-admins');
            if (response.data.success) {
                setTeamMembers(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch team members");
        } finally {
            setLoadingTeam(false);
        }
    };

    useEffect(() => {
        if (adminLevel === 'super' && view === 'list') {
            fetchTeam();
        }
    }, [adminLevel, view]);

    // 3. Management Actions
    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const actionWord = newStatus === 'suspended' ? 'suspend' : 'reactivate';
        
        if (!window.confirm(`Are you sure you want to ${actionWord} this sub-admin?`)) return;

        try {
            const response = await api.put(`/admin/sub-admins/${id}/status`, { status: newStatus });
            if (response.data.success) {
                fetchTeam(); // Refresh the list
            }
        } catch (error) {
            alert("Failed to update status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ CRITICAL WARNING: This will permanently delete this sub-admin's account and all their access. This action cannot be undone. Proceed?")) return;

        try {
            const response = await api.delete(`/admin/sub-admins/${id}`);
            if (response.data.success) {
                fetchTeam(); // Refresh the list
            }
        } catch (error) {
            alert("Failed to delete sub-admin.");
        }
    };

    // 4. Form Handlers (Existing logic)
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!/^[a-zA-Z\s]{2,50}$/.test(formData.name.trim())) newErrors.name = "Name must be 2-50 characters and contain only letters.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email address.";
        if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters long.";
        if (!/^\+?[\d\s\-]{9,15}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "Enter a valid phone number (9-15 digits).";
        
        if (!formData.dob) {
            newErrors.dob = "Date of birth is required.";
        } else {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            const minDate = new Date('1900-01-01');
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
            
            if (age < 18) newErrors.dob = "Sub-Admins must be at least 18 years old.";
            else if (birthDate < minDate) newErrors.dob = "Date of birth must be after 1900.";
            else if (formData.dob.split('-')[0].length !== 4) newErrors.dob = "Date of birth must have a valid 4-digit year.";
        }

        if (!formData.gender) newErrors.gender = "Please select a gender.";
        if (formData.address.trim().length < 5) newErrors.address = "Address must be at least 5 characters long.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateSubAdmin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await api.post('/admin/create-sub-admin', formData);
            if (response.data.success) {
                alert("🎉 Sub-Admin created successfully!");
                setFormData({ name: '', email: '', password: '', phoneNumber: '', address: '', dob: '', gender: '' });
                setErrors({});
                setView('list'); // Switch back to the ledger view
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to connect to the server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Verifying Security Clearance...</div>;

    if (adminLevel !== 'super') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 flex flex-col items-center max-w-md text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6"><Lock size={40} /></div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h1>
                    <p className="text-gray-500 font-medium mb-8">This area is classified. Only the Super Admin has the required clearance to manage the moderation team.</p>
                    <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors w-full">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <ShieldCheck className="mr-3 text-[#4a0b59]" size={32} /> Team Management
                    </h1>
                    <p className="text-gray-500 mt-1">Hire, monitor, and manage your platform's administrative staff.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto mb-6 flex space-x-2 border-b border-gray-200">
                <button 
                    onClick={() => setView('list')} 
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${view === 'list' ? 'border-[#4a0b59] text-[#4a0b59]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Current Team
                </button>
                <button 
                    onClick={() => setView('add')} 
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${view === 'add' ? 'border-[#4a0b59] text-[#4a0b59]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    + Hire Sub-Admin
                </button>
            </div>

            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                
                {view === 'list' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-5 font-bold">Staff Member</th>
                                    <th className="p-5 font-bold">Contact Details</th>
                                    <th className="p-5 font-bold text-center">Status</th>
                                    <th className="p-5 font-bold text-center">Security Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingTeam ? <tr><td colSpan="4" className="text-center py-8 text-gray-500 font-bold">Loading team ledger...</td></tr> : 
                                 teamMembers.length === 0 ? <tr><td colSpan="4" className="text-center py-8 text-gray-500 font-bold">No Sub-Admins found.</td></tr> :
                                 teamMembers.map(member => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${member.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-md">{member.name}</p>
                                                    <p className="text-xs font-bold text-blue-600 flex items-center mt-1"><Shield size={10} className="mr-1"/> Sub-Admin</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-medium text-gray-800 flex items-center mb-1"><Mail size={14} className="mr-2 text-gray-400"/> {member.email}</p>
                                            <p className="text-sm font-medium text-gray-500 flex items-center"><Phone size={14} className="mr-2 text-gray-400"/> {member.phone_number}</p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {member.status === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(member.id, member.status)}
                                                    className={`p-2 rounded-xl transition-colors tooltip ${member.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                    title={member.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                                                >
                                                    {member.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors tooltip"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                 ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'add' && (
                    <div className="animate-in fade-in">
                        <div className="p-8 border-b border-gray-100 bg-purple-50/50 flex items-start">
                            <AlertTriangle className="text-orange-500 mr-4 shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">Security Notice</h3>
                                <p className="text-sm text-gray-600">
                                    Sub-Admins have the power to review courses, suspend students, and message users. However, they are <strong>strictly blocked</strong> from viewing any financial data, revenue statistics, or payment histories.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateSubAdmin} className="p-8" noValidate>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" name="name" className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} placeholder="Jane Doe" value={formData.name} onChange={handleChange} />
                                    </div>
                                    {errors.name && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="email" name="email" className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.email ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} placeholder="admin@ziron.com" value={formData.email} onChange={handleChange} />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="password" name="password" className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.password ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} placeholder="••••••••" value={formData.password} onChange={handleChange} />
                                    </div>
                                    {errors.password && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" name="phoneNumber" className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.phoneNumber ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} placeholder="07xxxxxxxx" value={formData.phoneNumber} onChange={handleChange} />
                                    </div>
                                    {errors.phoneNumber && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.phoneNumber}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date of Birth</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="date" name="dob" min="1900-01-01" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium text-gray-700 transition-colors ${errors.dob ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} value={formData.dob} onChange={handleChange} />
                                    </div>
                                    {errors.dob && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.dob}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                                    <select name="gender" className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium text-gray-700 cursor-pointer transition-colors ${errors.gender ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} value={formData.gender} onChange={handleChange}>
                                        <option value="">Select Gender...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.gender && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.gender}</p>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Home Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <textarea name="address" rows="2" className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium resize-none transition-colors ${errors.address ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} placeholder="123 Main St, City" value={formData.address} onChange={handleChange}></textarea>
                                </div>
                                {errors.address && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.address}</p>}
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-100">
                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 flex items-center shadow-md transition-all disabled:opacity-50">
                                    {isSubmitting ? 'Registering...' : <><UserPlus size={18} className="mr-2" /> Authorize Sub-Admin</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin_Team;