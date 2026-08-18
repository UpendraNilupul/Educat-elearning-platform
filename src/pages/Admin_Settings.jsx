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
    
    // Validation Error State
    const [errors, setErrors] = useState({});

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
        // Clear specific error when user starts typing again
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validateProfile = () => {
        const newErrors = {};
        
        // Name: Letters and spaces only, 2-50 characters
        if (!/^[a-zA-Z\s]{2,50}$/.test(profileData.name.trim())) {
            newErrors.name = "Name must be 2-50 characters and contain only letters.";
        }

        // Email: Standard email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        // 🌟 UPDATED: +94 Phone Number Validation
        const cleanPhone = profileData.phone_number.replace(/[\s-]/g, ''); // Removes any spaces or dashes
        if (!/^\+94\d{9}$/.test(cleanPhone)) {
            newErrors.phone_number = "Phone number must begin with +94 followed by 9 digits (e.g., +94771234567).";
        }

        // Address: Minimum length check
        if (profileData.address.trim().length < 5) {
            newErrors.address = "Address must be at least 5 characters long.";
        }

        // DOB: Past dates only, reasonable minimum year
        if (profileData.dob) {
            const birthDate = new Date(profileData.dob);
            const today = new Date();
            const minDate = new Date('1900-01-01');
            
            if (birthDate >= today) {
                newErrors.dob = "Date of birth must be in the past.";
            } else if (birthDate < minDate) {
                newErrors.dob = "Date of birth must be after 1900.";
            }
        } else {
            newErrors.dob = "Date of birth is required.";
        }

        return newErrors;
    };

    const submitProfileUpdate = async (e) => {
        e.preventDefault();
        
        const profileValidationErrors = validateProfile();
        if (Object.keys(profileValidationErrors).length > 0) {
            setErrors(profileValidationErrors);
            return;
        }

        setIsSavingProfile(true);
        try {
            // 🌟 Clean the phone number before sending to the backend
            const payload = {
                ...profileData,
                phone_number: profileData.phone_number.replace(/[\s-]/g, '')
            };

            const response = await api.put(`/admin/profile/${adminId}`, payload);
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
        const newErrors = {};

        if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters long.";
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = "New passwords do not match.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSavingPassword(true);
        try {
            const response = await api.put(`/admin/change-password/${adminId}`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            const result = response.data;
            alert(result.message);
            if (result.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setErrors({});
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
                
                {/* Profile Details Column */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <User className="mr-2 text-gray-400" size={20} /> Personal Information
                        </h2>
                    </div>
                    
                    <form onSubmit={submitProfileUpdate} className="p-8" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} 
                                        value={profileData.name} 
                                        onChange={handleProfileChange} 
                                    />
                                </div>
                                {errors.name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.name}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="email" 
                                        name="email" 
                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium ${errors.email ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} 
                                        value={profileData.email} 
                                        onChange={handleProfileChange} 
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="phone_number" 
                                        placeholder="+947xxxxxxxx"
                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium ${errors.phone_number ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} 
                                        value={profileData.phone_number} 
                                        onChange={handleProfileChange} 
                                    />
                                </div>
                                {errors.phone_number && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.phone_number}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                                <select 
                                    name="gender" 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 font-medium text-gray-700 cursor-pointer" 
                                    value={profileData.gender} 
                                    onChange={handleProfileChange}
                                >
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
                                        min="1900-01-01"
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium text-gray-700 ${errors.dob ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} 
                                        value={profileData.dob} 
                                        onChange={handleProfileChange} 
                                    />
                                </div>
                                {errors.dob && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.dob}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        name="address" 
                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium ${errors.address ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`} 
                                        value={profileData.address} 
                                        onChange={handleProfileChange} 
                                    />
                                </div>
                                {errors.address && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.address}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button type="submit" disabled={isSavingProfile} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black flex items-center shadow-md transition-all disabled:opacity-50">
                                {isSavingProfile ? 'Saving...' : <><Save size={18} className="mr-2" /> Update Profile</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Column */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="p-6 border-b border-gray-100 bg-red-50/30">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center">
                            <Lock className="mr-2 text-red-400" size={20} /> Security Settings
                        </h2>
                    </div>

                    <form onSubmit={submitPasswordUpdate} className="p-8 space-y-5" noValidate>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                            <input 
                                type="password" 
                                name="currentPassword" 
                                required 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 font-medium" 
                                placeholder="••••••••" 
                                value={passwordData.currentPassword} 
                                onChange={handlePasswordChange} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                            <input 
                                type="password" 
                                name="newPassword" 
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium ${errors.newPassword ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-red-100'}`} 
                                placeholder="••••••••" 
                                value={passwordData.newPassword} 
                                onChange={handlePasswordChange} 
                            />
                            {errors.newPassword && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.newPassword}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 font-medium ${errors.confirmPassword ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-red-100'}`} 
                                placeholder="••••••••" 
                                value={passwordData.confirmPassword} 
                                onChange={handlePasswordChange} 
                            />
                            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.confirmPassword}</p>}
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