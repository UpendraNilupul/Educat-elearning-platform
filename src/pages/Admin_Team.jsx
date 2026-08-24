import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, Lock, UserPlus, ArrowLeft, 
    AlertTriangle, Mail, Phone, MapPin, Calendar, Users, Shield, Trash2, UserX, UserCheck, Briefcase
} from 'lucide-react';
import api from '../api';

const Admin_Team = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const [adminLevel, setAdminLevel] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [view, setView] = useState('list'); 
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for the form
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phoneNumber: '', 
        address: '', dob: '', gender: '', adminLevelType: 'moderator' 
    });
    const [errors, setErrors] = useState({});

    // Verify Access
    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const response = await api.get('/status');
                if (response.data.isLoggedIn) {
                    setAdminLevel(response.data.adminLevel);
                }
            } catch (error) {
                console.error("Access verification failed.");
            } finally {
                setIsChecking(false);
            }
        };
        verifyAccess();
    }, []);

    // Fetch the team list
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

    // Handle Suspend/Activate
    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'reactivate'} this staff member?`)) return;
        try {
            const response = await api.put(`/admin/sub-admins/${id}/status`, { status: newStatus });
            if (response.data.success) {
                fetchTeam();
            }
        } catch (error) { 
            alert("Failed to update status."); 
        }
    };

    // Handle Permanent Deletion
    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ CRITICAL WARNING: This will permanently delete this staff member's account and all their access. Proceed?")) return;
        try {
            const response = await api.delete(`/admin/sub-admins/${id}`);
            if (response.data.success) {
                fetchTeam();
            }
        } catch (error) { 
            alert("Failed to delete staff member."); 
        }
    };

    // Form Handlers
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!/^[a-zA-Z\s]{2,50}$/.test(formData.name.trim())) {
            newErrors.name = "Name must contain only letters.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Enter a valid email.";
        }
        if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }
        const cleanPhone = formData.phoneNumber.replace(/[\s-]/g, ''); 
        if (!/^\+94\d{9}$/.test(cleanPhone)) {
            newErrors.phoneNumber = "Phone number must begin with +94 followed by 9 digits.";
        }
        if (!formData.dob) {
            newErrors.dob = "DOB is required.";
        }
        if (!formData.gender) {
            newErrors.gender = "Select a gender.";
        }
        if (formData.address.trim().length < 5) {
            newErrors.address = "Address is required.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateSubAdmin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            const payload = { 
                ...formData, 
                phoneNumber: formData.phoneNumber.replace(/[\s-]/g, '') 
            };
            const response = await api.post('/admin/create-sub-admin', payload);
            if (response.data.success) {
                alert(`🎉 ${formData.adminLevelType === 'finance' ? 'Financial Manager' : 'Moderator'} created successfully!`);
                setFormData({ name: '', email: '', password: '', phoneNumber: '', address: '', dob: '', gender: '', adminLevelType: 'moderator' });
                setErrors({});
                setView('list'); 
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to connect.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Verifying Security Clearance...</div>;
    }

    if (adminLevel !== 'super') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="bg-white p-10 rounded-3xl shadow-xl text-center border border-red-100 max-w-md">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h1>
                    <p className="text-gray-500 font-medium mb-8">This area is classified. Only the Super Admin has the required clearance to manage the moderation team.</p>
                    <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors w-full">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center space-x-4 mb-4">
                        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold transition-colors">
                            <ArrowLeft size={20} className="mr-2" /> Go Back
                        </button>
                        <span className="text-gray-300 font-bold">|</span>
                        <button onClick={() => navigate('/admin')} className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold transition-colors">
                            Dashboard
                        </button>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <ShieldCheck className="mr-3 text-[#4a0b59]" size={32} /> Team Management
                    </h1>
                    <p className="text-gray-500 mt-1">Hire, monitor, and manage your platform's administrative staff.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mb-6 flex space-x-2 border-b border-gray-200">
                <button onClick={() => setView('list')} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${view === 'list' ? 'border-[#4a0b59] text-[#4a0b59]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Current Team
                </button>
                <button onClick={() => setView('add')} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${view === 'add' ? 'border-[#4a0b59] text-[#4a0b59]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    + Hire Staff
                </button>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {view === 'list' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-5 font-bold">Staff Member</th>
                                    <th className="p-5 font-bold">Role Access</th>
                                    <th className="p-5 font-bold">Contact Details</th>
                                    <th className="p-5 font-bold text-center">Status</th>
                                    <th className="p-5 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingTeam ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500 font-bold">Loading team ledger...</td></tr>
                                ) : teamMembers.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-500 font-bold">No Staff found.</td></tr>
                                ) : (
                                 teamMembers.map(member => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="p-5 flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-200 text-gray-700">
                                                {member.name.charAt(0)}
                                            </div>
                                            <p className="font-bold text-gray-900 text-md">{member.name}</p>
                                        </td>
                                        <td className="p-5">
                                            {member.admin_level === 'finance' ? (
                                                <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center w-fit">
                                                    <Briefcase size={12} className="mr-1"/> Financial Mgr
                                                </span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase flex items-center w-fit">
                                                    <Shield size={12} className="mr-1"/> Moderator
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm text-gray-800 mb-1 flex items-center">
                                                <Mail size={14} className="mr-2 text-gray-400"/> {member.email}
                                            </p>
                                            <p className="text-sm text-gray-500 flex items-center">
                                                <Phone size={14} className="mr-2 text-gray-400"/> {member.phone_number}
                                            </p>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {member.status === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(member.id, member.status)} 
                                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                                >
                                                    {member.status === 'active' ? <UserX size={18} className="text-orange-600"/> : <UserCheck size={18} className="text-green-600"/>}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(member.id)} 
                                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                 ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'add' && (
                    <form onSubmit={handleCreateSubAdmin} className="p-8 animate-in fade-in" noValidate>
                        
                        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <ShieldCheck className="mr-2 text-[#4a0b59]" size={20}/> Assign System Role
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start space-x-3 ${formData.adminLevelType === 'moderator' ? 'border-[#4a0b59] bg-purple-50/50' : 'border-gray-200 bg-white hover:border-purple-200'}`}>
                                    <input 
                                        type="radio" 
                                        name="adminLevelType" 
                                        value="moderator" 
                                        checked={formData.adminLevelType === 'moderator'} 
                                        onChange={handleChange} 
                                        className="mt-1 accent-[#4a0b59]" 
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900">System Moderator</p>
                                        <p className="text-xs text-gray-500 mt-1">Can manage students, teachers, courses, and messaging. Blocked from all financials.</p>
                                    </div>
                                </label>
                                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start space-x-3 ${formData.adminLevelType === 'finance' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white hover:border-green-200'}`}>
                                    <input 
                                        type="radio" 
                                        name="adminLevelType" 
                                        value="finance" 
                                        checked={formData.adminLevelType === 'finance'} 
                                        onChange={handleChange} 
                                        className="mt-1 accent-green-600" 
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900">Financial Manager</p>
                                        <p className="text-xs text-gray-500 mt-1">Can manage payouts, bank slip approvals, and financial exports. Blocked from system management.</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                                <input type="text" name="name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" value={formData.name} onChange={handleChange} />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                                <input type="email" name="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" value={formData.email} onChange={handleChange} />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Temporary Password</label>
                                <input type="password" name="password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" value={formData.password} onChange={handleChange} />
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                                <input type="text" name="phoneNumber" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" placeholder="+94xxxxxxxxx" value={formData.phoneNumber} onChange={handleChange} />
                                {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date of Birth</label>
                                <input type="date" name="dob" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" value={formData.dob} onChange={handleChange} />
                                {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gender</label>
                                <select name="gender" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100" value={formData.gender} onChange={handleChange}>
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Home Address</label>
                            <textarea name="address" rows="2" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 resize-none" value={formData.address} onChange={handleChange}></textarea>
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 transition-all disabled:opacity-50">
                                {isSubmitting ? 'Registering...' : '+ Authorize Staff Member'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Admin_Team;