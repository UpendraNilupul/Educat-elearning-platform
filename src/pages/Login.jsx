import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Import the unified API instance
import '../styles/login.css';

// 🌟 ADDED setUserName AND setUserPicture HERE
const Login = ({ setUserRole, setUserName, setUserPicture, setAdminLevel }) => {
    // Standard Login States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Forgot Password States
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const navigate = useNavigate();

    // --- STANDARD LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // 🌟 THE FIX: Use api.post
            const response = await api.post('/login', { email, password });
            const data = response.data; // Axios handles the JSON parsing

            // 🌟 THE FIX: Force the role to be completely lowercase and remove spaces
            const safeRole = String(data.userRole || '').toLowerCase().trim();

            // Save data using safeRole
            localStorage.setItem('adminLevel', data.adminLevel || 'super');
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userRole', safeRole);
            localStorage.setItem('verificationStatus', data.verificationStatus || '');
            localStorage.setItem('userPicture', data.userPicture || ''); // 🌟 MERGED from Dev


            if (setUserRole) setUserRole(safeRole);
            if (setUserName) setUserName(data.userName);
            if (setAdminLevel) setAdminLevel(data.adminLevel || 'super');
            if (setUserPicture) setUserPicture(data.userPicture || ''); // 🌟 MERGED from Dev

            // 🔥 Redirect logic using safeRole
            if (safeRole === 'admin') {
                navigate('/admin');
            } else if (safeRole === 'teacher') {
                if (data.verificationStatus !== 'approved') {
                    navigate(`/verify-teacher/${data.userId}`);
                } else {
                    navigate('/teacher');
                }
            } else if (safeRole === 'student') {
                navigate('/student');
            } else {
                navigate('/');
            }

        } catch (error) {
            console.error('Error during login:', error);
            // 🌟 THE FIX: Grab the exact error message from your backend
            alert(error.response?.data?.message || 'Something went wrong connecting to the server.');
        }
    };

    // --- FORGOT PASSWORD LOGIC ---
    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            // 🌟 THE FIX: Use api.post
            await api.post('/forgot-password/send-otp', { email });
            
            alert('OTP sent to your email and phone!');
            setForgotStep(2);
        } catch (err) { 
            alert(err.response?.data?.message || 'Error sending OTP'); 
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            // 🌟 THE FIX: Use api.post
            await api.post('/forgot-password/verify-otp', { email, otp });
            
            setForgotStep(3); // Move to password reset step on success
        } catch (err) { 
            alert(err.response?.data?.message || 'Error verifying OTP'); 
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            // 🌟 THE FIX: Use api.post
            await api.post('/forgot-password/reset-password', { email, otp, newPassword });
            
            alert('Password reset successful! You can now log in.');
            setIsForgotPassword(false); // Go back to login screen
            setForgotStep(1);
            setPassword('');
        } catch (err) { 
            alert(err.response?.data?.message || 'Error resetting password'); 
        }
    };

    return (
        <div className="login-form-container pt-32 pb-12">
            
            {/* --- FORGOT PASSWORD FLOW --- */}
            {isForgotPassword ? (
                <div className="p-8" id="login-form">
                    <h3>Reset Password</h3>
                    
                    {forgotStep === 1 && (
                        <form onSubmit={handleSendOtp}>
                            <p className="mb-4 text-gray-600">Enter your email to receive an OTP.</p>
                            <input type="email" placeholder="Your Email" className="box" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="submit" value="Send OTP" className="btn" />
                        </form>
                    )}

                    {forgotStep === 2 && (
                        <form onSubmit={handleVerifyOtp}>
                            <p className="mb-4 text-gray-600">Enter the 6-digit OTP sent to {email}.</p>
                            <input type="text" placeholder="Enter OTP" className="box" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                            <input type="submit" value="Verify OTP" className="btn" />
                        </form>
                    )}

                    {forgotStep === 3 && (
                        <form onSubmit={handleResetPassword}>
                            <p className="mb-4 text-gray-600">Create a new password.</p>
                            <div className="relative w-full mb-[1.2rem]">
                                <input type={showPassword ? "text" : "password"} placeholder="New Password" className="box !mb-0 pr-10" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer flex items-center justify-center p-2" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <input type="submit" value="Reset Password" className="btn" />
                        </form>
                    )}

                    <p className="mt-4">
                        Remembered it? <button onClick={() => {setIsForgotPassword(false); setForgotStep(1);}} className="text-blue-500 underline border-none bg-transparent cursor-pointer">Back to Login</button>
                    </p>
                </div>
            ) : (
                
            /* --- STANDARD LOGIN FLOW --- */
            <form onSubmit={handleLogin} id="login-form" className="p-8">
                <h3>login now</h3>

                <input type="email" placeholder="your email" className="box" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <div className="relative w-full mb-[1.2rem]">
                    <input type={showPassword ? "text" : "password"} placeholder="your password" className="box !mb-0 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer flex items-center justify-center p-2" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <input type="submit" value="login" className="btn" />

                <input type="checkbox" id="remember-me" />
                <label htmlFor="remember-me">remember me</label>

                {/* 🌟 THIS TRIGGERS THE FORGOT PASSWORD FLOW */}
                <p>forget password? <button type="button" onClick={() => setIsForgotPassword(true)} className="text-blue-500 underline border-none bg-transparent cursor-pointer">click here</button></p>

                <p>don't have an account? <a href="/register" id="register-link">create one</a></p>
            </form>
            )}
        </div>
    );
};

export default Login;