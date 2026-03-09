import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
        address: '',
        dob: '',
        gender: '',
        role: 'student' 
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (error) setError(''); 
    };

    const validateForm = () => {
        const { phoneNumber, email, password, name, dob, gender } = formData;

        if (name.trim().length < 3) return "Name must be at least 3 characters.";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address.";

        if (password.length < 6) return "Password must be at least 6 characters.";

        
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneNumber)) return "Phone number must be exactly 10 digits.";

        if (!dob) return "Date of Birth is required.";
        if (!gender) return "Please select your gender.";

        return null;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            window.scrollTo(0, 0); 
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            alert('ok');

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Redirecting to login...');
                navigate('/login');
            } else {
                setError(data.message || 'Registration failed. This email may already be in use.');
            }
        } catch (err) {
            setError('Unable to connect to the server. Please check your connection.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-gray-50 to-gray-100 pt-32 pb-12 px-4">
            <form
                onSubmit={handleRegister}
                className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_10px_25px_rgba(74,11,89,0.05),0_20px_48px_rgba(0,0,0,0.05)] text-center p-10 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(74,11,89,0.08),0_24px_50px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
            >
                <h3 className="text-3xl font-extrabold text-brand-purple mb-8 -tracking-[0.5px] capitalize">
                    Join Us
                </h3>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-left">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Amal perera"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] placeholder:text-gray-400 box-border"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="example@gmail.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] placeholder:text-gray-400 box-border"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Min 6 characters"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] placeholder:text-gray-400 box-border"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="07xxxxxxxx"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] placeholder:text-gray-400 box-border"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            maxLength="10"
                            required
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Address</label>
                    <textarea
                        name="address"
                        placeholder="Enter your full address"
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] placeholder:text-gray-400 box-border h-24 resize-none"
                        value={formData.address}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                        <input
                            type="date"
                            name="dob"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] box-border"
                            value={formData.dob}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                        <select
                            name="gender"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-base text-gray-900 transition-all duration-300 ease-out focus:outline-none focus:bg-white focus:border-brand-orange focus:shadow-[0_0_0_4px_rgba(237,137,54,0.15)] box-border"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-lg font-medium text-gray-700 mb-4 text-left">I am a:</p>
                    <div className="flex gap-8 justify-center">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="student"
                                checked={formData.role === 'student'}
                                onChange={handleChange}
                                className="mr-3 w-4 h-4 text-brand-orange focus:ring-brand-orange"
                            />
                            <span className="text-base font-medium text-gray-700">Student</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="teacher"
                                checked={formData.role === 'teacher'}
                                onChange={handleChange}
                                className="mr-3 w-4 h-4 text-brand-orange focus:ring-brand-orange"
                            />
                            <span className="text-base font-medium text-gray-700">Teacher</span>
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-brand-orange to-orange-700 text-white py-4 text-lg font-bold tracking-wide border-none rounded-xl cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(237,137,54,0.25)] hover:shadow-[0_6px_16px_rgba(237,137,54,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                >
                    Create Account
                </button>

                <p className="mt-6 text-base text-gray-500">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-brand-purple font-bold no-underline relative transition-colors duration-300 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-[-2px] after:left-0 after:bg-brand-orange after:origin-bottom-right after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100 hover:after:origin-bottom-left"
                    >
                        Login here
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Register;