import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, User, Lock, Save, ArrowLeft, ShieldCheck 
} from 'lucide-react';

const Admin_Settings = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    const adminId = localStorage.getItem('userId');
    
    // States
    const [loading, setLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const [profileData, setProfileData] = useState({
        name: '', email: '', phone_number: '', address: '', dob: '', gender: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });

    // Fetch initial data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/profile/${adminId}`, { credentials: 'include' });
                const result = await response.json();
                if (result.success) {
                    setProfileData(result.data);
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [adminId]);

    // Handle Profile Update
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const response = await fetch(`http://localhost:3000/api/admin/profile/${adminId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
                credentials: 'include'
            });
            const result = await response.json();
            alert(result.message);
            // Optionally update the global userName if they changed it!
            if (result.success && profileData.name !== userName) {
                localStorage.setItem('userName', profileData.name);
                window.location.reload(); // Quick refresh to update sidebar names
            }
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle Password Update
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setIsSavingPassword(true);
        try {
            const response = await fetch(`http://localhost:3000/api/admin/change-password/${adminId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
                credentials: 'include'
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            alert("Failed to change password.");
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading Settings...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-end">
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
                    <p className="text-gray-500 mt-1">Manage your administrator profile and security preferences.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* General Information Card */}
                <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-[#4a0b59] flex items-center justify-center mr-4">
                            <User size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    </div>
                    
                    <div className="p-6 space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                            <input type="text" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-sm"
                                value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                            <input type="email" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-sm"
                                value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                <input type="text" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-sm"
                                    value={profileData.phone_number} onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
                                <select required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-sm"
                                    value={profileData.gender} onChange={(e) => setProfileData({...profileData, gender: e.target.value})}>
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                                <input type="date" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-sm"
                                    value={profileData.dob} onChange={(e) => setProfileData({...profileData, dob: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                                <input type="text" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 focus:bg-white text-sm"
                                    value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button type="submit" disabled={isSavingProfile} className="px-6 py-2.5 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 flex items-center shadow-sm transition-all disabled:opacity-50">
                            {isSavingProfile ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Profile</>}
                        </button>
                    </div>
                </form>

                {/* Security Card */}
                <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-4">
                            <ShieldCheck size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Security & Password</h2>
                    </div>
                    
                    <div className="p-6 space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="password" required placeholder="Enter current password" minLength="6"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 text-sm"
                                    value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-100 my-4 pt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                            <div className="relative mb-4">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="password" required placeholder="Enter new password" minLength="6"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 text-sm"
                                    value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                            </div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="password" required placeholder="Confirm new password" minLength="6"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 text-sm"
                                    value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button type="submit" disabled={isSavingPassword} className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 flex items-center shadow-sm transition-all disabled:opacity-50">
                            {isSavingPassword ? 'Updating...' : <><Lock size={18} className="mr-2" /> Update Password</>}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default Admin_Settings;