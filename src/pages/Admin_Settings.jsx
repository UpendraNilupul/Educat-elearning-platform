import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, ArrowLeft, User, Lock, Mail, Phone, 
    MapPin, Calendar, ShieldCheck, Save
} from 'lucide-react';
import api from '../api';

const Admin_Settings = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const adminId = localStorage.getItem('userId');
    const adminLevel = localStorage.getItem('adminLevel');

    const [loading, setLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: '', email: '', phone_number: '', address: '', dob: '', gender: ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/admin/profile/${adminId}`);
                const result = response.data;
                if (result.success) {
                    setProfileData(result.data);
                }
            } catch (error) {
                console.error("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [adminId]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const submitProfileUpdate = async (e) => {
        e.preventDefault();

        if (profileData.dob) {
            const birthDate = new Date(profileData.dob);
            const today = new Date();
            const minDate = new Date('1900-01-01');
            if (birthDate >= today) {
                alert("Date of birth must be in the past.");
                return;
            }
            if (birthDate < minDate) {
                alert("Date of birth must be after 1900-01-01.");
                return;
            }
            if (profileData.dob.split('-')[0].length !== 4) {
                alert("Date of birth must have a valid 4-digit year.");
                return;
            }
        }

        setIsSavingProfile(true);
        try {
            // 🌟 THE FIX: Pass the profileData object directly to api.put
            const response = await api.put(`/admin/profile/${adminId}`, profileData);
            const result = response.data;
            alert(result.message);
            if (result.success) {
                localStorage.setItem('userName', profileData.name); 
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const submitPasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return alert("New passwords do not match!");
        }
        if (passwordData.newPassword.length < 6) {
            return alert("Password must be at least 6 characters long.");
        }

        setIsSavingPassword(true);
        try {
            // 🌟 THE FIX: Pass the raw object directly! No { body: JSON.stringify(...) } needed.
            const response = await api.put(`/admin/change-password/${adminId}`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            const result = response.data;
            alert(result.message);
            if (result.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update password.");
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Loading Settings...</div>;

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
                        <Settings className="mr-3 text-[#4a0b59]" size={32} /> Account Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your personal profile and security credentials.</p>
                </div>
                <div className="bg-purple-50 text-[#4a0b59] px-4 py-2 rounded-xl font-bold border border-purple-100 flex items-center shadow-sm uppercase text-sm tracking-wider">
                    <ShieldCheck size={18} className="mr-2" /> {adminLevel} Admin Clearance
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Profile Details Column (Takes up 2/3) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <User className="mr-2 text-gray-400" size={20} /> Personal Information
                        </h2>
                    </div>
                    
                    <form onSubmit={submitProfileUpdate} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" name="name" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium" value={profileData.name} onChange={handleProfileChange} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="email" name="email" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium" value={profileData.email} onChange={handleProfileChange} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" name="phone_number" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium" value={profileData.phone_number} onChange={handleProfileChange} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                                <select name="gender" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium text-gray-700 cursor-pointer" value={profileData.gender} onChange={handleProfileChange}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="date" 
                                        name="dob" 
                                        required 
                                        min="1900-01-01"
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium text-gray-700" 
                                        value={profileData.dob} 
                                        onChange={handleProfileChange} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" name="address" required className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium" value={profileData.address} onChange={handleProfileChange} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button type="submit" disabled={isSavingProfile} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black flex items-center shadow-md transition-all disabled:opacity-50">
                                {isSavingProfile ? 'Saving...' : <><Save size={18} className="mr-2" /> Update Profile</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Column (Takes up 1/3) */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="p-6 border-b border-gray-100 bg-red-50/30">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <Lock className="mr-2 text-red-400" size={20} /> Security Settings
                        </h2>
                    </div>

                    <form onSubmit={submitPasswordUpdate} className="p-8 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                            <input type="password" name="currentPassword" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 font-medium" placeholder="••••••••" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                            <input type="password" name="newPassword" required minLength="6" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 font-medium" placeholder="••••••••" value={passwordData.newPassword} onChange={handlePasswordChange} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input type="password" name="confirmPassword" required minLength="6" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 font-medium" placeholder="••••••••" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={isSavingPassword} className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 flex items-center justify-center shadow-md transition-all disabled:opacity-50">
                                {isSavingPassword ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Admin_Settings;