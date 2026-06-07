import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, Lock, UserPlus, ArrowLeft, 
    AlertTriangle, CheckCircle, Mail, Phone, MapPin, Calendar, Users
} from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Import the API instance

const Admin_Team = ({ userName, onLogout }) => {
    const navigate = useNavigate();
    
    const [adminLevel, setAdminLevel] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phoneNumber: '', 
        address: '', dob: '', gender: ''
    });
    
    // 🌟 ADDED: State to track form validation errors
    const [errors, setErrors] = useState({});

    // 🌟 SECURITY CHECK: Ask the backend if we are a Super Admin
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear the specific error when the user starts typing again
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    // 🌟 ADDED: Custom validation logic
    const validateForm = () => {
        let newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = "Full name is required.";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) newErrors.email = "Please enter a valid email address.";
        
        if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters long.";
        
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phoneNumber)) newErrors.phoneNumber = "Phone number must be exactly 10 digits.";
        
        if (!formData.dob) {
            newErrors.dob = "Date of birth is required.";
        } else {
            // Check if they are at least 18 years old
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) newErrors.dob = "Sub-Admins must be at least 18 years old.";
        }

        if (!formData.gender) newErrors.gender = "Please select a gender.";
        if (!formData.address.trim()) newErrors.address = "Home address is required.";

        setErrors(newErrors);
        // Returns true if there are NO errors
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateSubAdmin = async (e) => {
        e.preventDefault();
        
        // Run validation before allowing submission
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post('/admin/create-sub-admin', formData);
            const result = response.data;

            if (result.success) {
                alert("🎉 Sub-Admin created successfully!");
                setFormData({ name: '', email: '', password: '', phoneNumber: '', address: '', dob: '', gender: '' });
                setErrors({});
                navigate('/admin'); // Send them back to dashboard after success
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to connect to the server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Verifying Security Clearance...</div>;
    }

    // 🛑 THE LOCKDOWN SCREEN
    if (adminLevel !== 'super') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 flex flex-col items-center max-w-md text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h1>
                    <p className="text-gray-500 font-medium mb-8">
                        This area is classified. Only the Super Admin has the required clearance to manage the moderation team.
                    </p>
                    <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors w-full">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ✅ THE SUPER ADMIN CREATOR SCREEN
    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-3xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-500 hover:text-[#4a0b59] font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <ShieldCheck className="mr-3 text-[#4a0b59]" size={32} /> Team Management
                    </h1>
                    <p className="text-gray-500 mt-1">Hire and register new Sub-Admins to help moderate the platform.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
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
                        
                        {/* Name & Email */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    name="name" 
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.name ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                    placeholder="Jane Doe" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                />
                            </div>
                            {errors.name && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    name="email" 
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.email ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                    placeholder="admin@ziron.com" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.email}</p>}
                        </div>

                        {/* Password & Phone */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    name="password" 
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.password ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                    placeholder="••••••••" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                />
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    name="phoneNumber" 
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium transition-colors ${errors.phoneNumber ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                    placeholder="07xxxxxxxx" 
                                    value={formData.phoneNumber} 
                                    onChange={handleChange} 
                                />
                            </div>
                            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.phoneNumber}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="date" 
                                    name="dob" 
                                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium text-gray-700 transition-colors ${errors.dob ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                    value={formData.dob} 
                                    onChange={handleChange} 
                                />
                            </div>
                            {errors.dob && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.dob}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                            <select 
                                name="gender" 
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium text-gray-700 cursor-pointer transition-colors ${errors.gender ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                value={formData.gender} 
                                onChange={handleChange}
                            >
                                <option value="">Select Gender...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            {errors.gender && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.gender}</p>}
                        </div>
                    </div>

                    {/* Address (Full Width) */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Home Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                            <textarea 
                                name="address" 
                                rows="2" 
                                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:bg-white font-medium resize-none transition-colors ${errors.address ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 focus:ring-purple-100'}`}
                                placeholder="123 Main St, City" 
                                value={formData.address} 
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        {errors.address && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.address}</p>}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-[#4a0b59] text-white font-bold rounded-xl hover:bg-purple-900 flex items-center shadow-md transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Registering...' : <><UserPlus size={18} className="mr-2" /> Authorize Sub-Admin</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Admin_Team;