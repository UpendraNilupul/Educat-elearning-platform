import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlignCenter, Eye, EyeOff } from 'lucide-react';
import '../styles/login.css';

const Register = ({ setUserName, setUserRole }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    dob: '',
    gender: '',
    role: 'student'
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (value.trim().length < 3) error = 'Name must be at least 3 characters';
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email address';
        break;

      case 'password':
        if (value.length < 6) error = 'Password must be at least 6 characters';
        break;

      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match';
        break;

      case 'phoneNumber':
        if (!/^\+94\d{9}$/.test(value)) error = 'Phone must be in +94XXXXXXXXX format';
        break;

      case 'dob':
        if (value) {
          const selectedDate = new Date(value);
          const limitDate = new Date('2016-02-01');
          if (selectedDate >= limitDate) error = 'Date must be before 2016-02-01';
        }
        break;

      case 'gender':
        if (!value) error = 'Please select your gender';
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber' && !/^\+?\d*$/.test(value)) return;

    const cleanedValue = value.replace(/^\s+/, '');

    setFormData((prev) => ({ ...prev, [name]: cleanedValue }));

    validateField(name, cleanedValue);

    if (name === 'password') {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, password, confirmPassword, phoneNumber, dob, gender } = formData;

    if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!/^\+94\d{9}$/.test(phoneNumber)) newErrors.phoneNumber = 'Phone must be in +94XXXXXXXXX format';

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
      const { confirmPassword, ...payload } = formData;

      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registration successful!');

        const safeRole = String(payload.role || data.userRole || '').toLowerCase().trim();
        const safeName = data.userName || payload.name;

        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', safeRole);
        localStorage.setItem('userName', safeName);

        if (setUserRole) setUserRole(safeRole);
        if (setUserName) setUserName(safeName);

        if (safeRole === 'admin') navigate('/admin');
        else if (safeRole === 'teacher') navigate(`/verify-teacher/${data.userId}`);
        else if (safeRole === 'student') navigate('/student');
        else navigate('/login');
      } else {
        alert(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection failed. Is your backend running?');
    }
  };

  const isFormValid =
    Object.values(errors).every((err) => err === '') &&
    formData.name &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.phoneNumber &&
    formData.address &&
    formData.gender;

  const errorStyle = { color: 'red', fontSize: '0.85rem', marginTop: '4px' };
  const getInputClass = (field) => `box ${errors[field] ? 'border border-red-500' : ''}`;

  return (
    <div className="login-form-container pt-32 pb-12">
      <form onSubmit={handleRegister} id="login-form" className="p-8">

        <div style={{ textAlign: 'left' }}>
          <h3 style={{ textAlign: 'center' }}>Register Now</h3>

          <label>Name</label>
          <input type="text" name="name" className={getInputClass('name')}
            value={formData.name} onChange={handleChange} required />
          {errors.name && <p style={errorStyle}>{errors.name}</p>}

          <label>Email</label>
          <input type="email" name="email" className={getInputClass('email')}
            value={formData.email} onChange={handleChange} placeholder='abc@example.com' required />
          {errors.email && <p style={errorStyle}>{errors.email}</p>}

          <label>Password</label>
          <div className="relative w-full mb-[1.2rem]">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`${getInputClass('password')} !mb-0 pr-10`}
              value={formData.password}
              onChange={handleChange}
              placeholder='enter 6 characters'
              required
            />
            <button type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p style={errorStyle}>{errors.password}</p>}

          <label>Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            className={getInputClass('confirmPassword')}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}

          <label>Phone Number</label>
          <input type="text" name="phoneNumber" className={getInputClass('phoneNumber')}
            value={formData.phoneNumber} onChange={handleChange} required placeholder='+94xxxxxxxxx'/>
          {errors.phoneNumber && <p style={errorStyle}>{errors.phoneNumber}</p>}

          <label>Address</label>
          <textarea name="address" className="box"
            value={formData.address} onChange={handleChange} required />

          <label>Date of Birth</label>
          <input type="date" name="dob" className={getInputClass('dob')}
            value={formData.dob} onChange={handleChange} max="2016-01-31" />
          {errors.dob && <p style={errorStyle}>{errors.dob}</p>}

          <label>Gender</label>
          <select name="gender" className={getInputClass('gender')}
            value={formData.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <p style={errorStyle}>{errors.gender}</p>}

          <p className="mb-2">I am a:
            <div style={{ textAlign: 'center' }}>
              <label className="mr-4">
                <input type="radio" name="role" value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange} /> Student
              </label>

              <label>
                <input type="radio" name="role" value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={handleChange} /> Teacher
              </label>
            </div>
          </p>

          <input
            type="submit"
            value="Create Account"
            className={`btn ${isFormValid ? '' : 'cursor-not-allowed opacity-50'}`}
            disabled={!isFormValid}
          />

          <p className="mt-4 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 underline">
              Login here
            </Link>
          </p>

        </div>
      </form>
    </div>
  );
};

export default Register;