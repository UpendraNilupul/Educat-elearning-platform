import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/login.css'; // same CSS as login page

const Register = ({ setUserName, setUserRole }) => {
  const navigate = useNavigate();

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

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber' && !/^\d*$/.test(value)) return;

    setFormData({ ...formData, [name]: value.replace(/^\s+/, '') });
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, password, phoneNumber, dob, gender } = formData;

    if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = 'Invalid email address';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!/^\d{10}$/.test(phoneNumber)) newErrors.phoneNumber = 'Phone number must be 10 digits';
    if (dob) {
      const selectedDate = new Date(dob);
      const limitDate = new Date('2016-02-01');
      if (selectedDate >= limitDate) newErrors.dob = 'Date of birth must be before 2016-02-01';
    }
    if (!gender) newErrors.gender = 'Please select your gender';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registration successful!');

        const finalRole = (formData.role || data.userRole || '').toLowerCase();
        const finalName = data.userName || formData.name;

        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', finalRole);
        localStorage.setItem('userName', finalName);

        if (setUserRole) setUserRole(finalRole);
        if (setUserName) setUserName(finalName);

        if (finalRole === 'admin') navigate('/admin');
        else if (finalRole === 'teacher') navigate(`/verify-teacher/${data.userId}`);
        else if (finalRole === 'student') navigate('/student');
        else navigate('/login');
      } else {
        alert(data.message || 'Registration failed.');
      }
    } catch (err) {
      alert('Server connection failed.');
    }
  };

  const isFormFilled = formData.name && formData.email && formData.password &&
    formData.phoneNumber && formData.address && formData.gender;

  return (
    <div className="login-form-container pt-32 pb-12">
      <form onSubmit={handleRegister} id="login-form" className="p-8">
        <h3>Register Now</h3>

        {/* NAME */}
        <input type="text" name="name" placeholder="Full Name" className="box"
          value={formData.name} onChange={handleChange} required />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        {/* EMAIL */}
        <input type="email" name="email" placeholder="Email" className="box"
          value={formData.email} onChange={handleChange} required />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        {/* PASSWORD */}
        <div className="relative w-full mb-[1.2rem]">
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" className="box !mb-0 pr-10"
            value={formData.password} onChange={handleChange} required />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer flex items-center justify-center p-2"
            onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        {/* PHONE */}
        <input type="text" name="phoneNumber" placeholder="07xxxxxxxx" className="box"
          value={formData.phoneNumber} onChange={handleChange} maxLength="10" required
          inputMode="numeric" pattern="[0-9]*"
          onPaste={(e) => { const paste = e.clipboardData.getData('text'); if (!/^\d+$/.test(paste)) e.preventDefault(); }} />
        {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}

        {/* ADDRESS */}
        <textarea name="address" placeholder="Address" className="box"
          value={formData.address} onChange={handleChange} required />
        
        {/* DOB */}
        <input type="date" name="dob" className="box" value={formData.dob} onChange={handleChange} max="2016-01-31" />
        {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}

        {/* GENDER */}
        <select name="gender" className="box" value={formData.gender} onChange={handleChange} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}

        {/* ROLE */}
        <p className="mb-2">I am a:</p>
        <label className="mr-4">
          <input type="radio" name="role" value="student"
            checked={formData.role === 'student'} onChange={handleChange} /> Student
        </label>
        <label>
          <input type="radio" name="role" value="teacher"
            checked={formData.role === 'teacher'} onChange={handleChange} /> Teacher
        </label>

        {/* SUBMIT */}
        <input type="submit" value="Create Account" className={`btn ${isFormFilled ? '' : 'cursor-not-allowed opacity-50'}`} disabled={!isFormFilled} />

        <p className="mt-4 text-center">
          Already have an account? <Link to="/login" className="text-blue-500 underline">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;