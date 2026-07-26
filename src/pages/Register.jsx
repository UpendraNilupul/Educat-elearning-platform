import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Import the API instance
import '../styles/login.css';

// 🌟 Sri Lankan Provinces & Districts Mapping
const locationData = {
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Eastern': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'Sabaragamuwa': ['Kegalle', 'Ratnapura'],
  'Southern': ['Galle', 'Hambantota', 'Matara'],
  'Uva': ['Badulla', 'Monaragala'],
  'Western': ['Colombo', 'Gampaha', 'Kalutara']
};

const Register = ({ setUserName, setUserRole }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    province: '', 
    district: '', 
    address: '', // Technically unused now, but keeping for state completeness
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
          const minDate = new Date('1900-01-01');
          if (selectedDate >= limitDate) {
            error = 'Date must be before 2016-02-01';
          } else if (selectedDate < minDate) {
            error = 'Date of birth must be after 1900-01-01';
          } else if (value.split('-')[0].length > 4) {
            error = 'Year must be a 4-digit number';
          }
        }
        break;
      case 'gender':
        if (!value) error = 'Please select your gender';
        break;
      case 'province':
        if (!value) error = 'Please select your province';
        break;
      case 'district':
        if (!value) error = 'Please select your district';
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

    // 🌟 If Province changes, reset the District to blank
    if (name === 'province') {
        setFormData((prev) => ({ ...prev, province: cleanedValue, district: '' }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
    }

    validateField(name, cleanedValue);

    if (name === 'password') {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, password, confirmPassword, phoneNumber, dob, gender, province, district } = formData;

    if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!/^\+94\d{9}$/.test(phoneNumber)) newErrors.phoneNumber = 'Phone must be in +94XXXXXXXXX format';
    if (!province) newErrors.province = 'Please select your province';
    if (!district) newErrors.district = 'Please select your district';
    if (!gender) newErrors.gender = 'Please select your gender';

    if (dob) {
      const selectedDate = new Date(dob);
      const limitDate = new Date('2016-02-01');
      const minDate = new Date('1900-01-01');
      if (selectedDate >= limitDate) {
        newErrors.dob = 'Date of birth must be before 2016-02-01';
      } else if (selectedDate < minDate) {
        newErrors.dob = 'Date of birth must be after 1900-01-01';
      } else if (dob.split('-')[0].length > 4) {
        newErrors.dob = 'Date of birth must have a valid 4-digit year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const { confirmPassword, ...payload } = formData;

      // 🌟 THE FIX: Use api.post
      const response = await api.post('/register', payload);
      const data = response.data; // Axios handles JSON automatically

      if (data.userId) { // Checking if userId was returned is a safe way to check success
        alert(`Registration successful! Your ID Code is: ${data.userCode}`);

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
      }
    } catch (err) {
      console.error(err);
      // 🌟 THE FIX: Handle backend validation errors gracefully
      alert(err.response?.data?.message || 'Server connection failed. Is your backend running?');
    }
  };

  const isFormValid =
    Object.values(errors).every((err) => err === '') &&
    formData.name && formData.email && formData.password &&
    formData.confirmPassword && formData.phoneNumber && 
    formData.gender && formData.province && formData.district; 

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
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-2 flex items-center justify-center"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} className="text-gray-500" /> : <Eye size={20} className="text-gray-500" />}
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

          {/* 🌟 NEW: Location Selectors */}
          <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label>Province</label>
                  <select name="province" className={getInputClass('province')} value={formData.province} onChange={handleChange} required>
                      <option value="">Select Province...</option>
                      {Object.keys(locationData).map(prov => (
                          <option key={prov} value={prov}>{prov}</option>
                      ))}
                  </select>
                  {errors.province && <p style={errorStyle}>{errors.province}</p>}
              </div>
              <div>
                  <label>District</label>
                  <select name="district" className={getInputClass('district')} value={formData.district} onChange={handleChange} required disabled={!formData.province}>
                      <option value="">Select District...</option>
                      {formData.province && locationData[formData.province].map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                      ))}
                  </select>
                  {errors.district && <p style={errorStyle}>{errors.district}</p>}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label>Date of Birth</label>
                  <input type="date" name="dob" className={getInputClass('dob')}
                    value={formData.dob} onChange={handleChange} min="1900-01-01" max="2016-01-31" required />
                  {errors.dob && <p style={errorStyle}>{errors.dob}</p>}
              </div>
              <div>
                  <label>Gender</label>
                  <select name="gender" className={getInputClass('gender')}
                    value={formData.gender} onChange={handleChange} required>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p style={errorStyle}>{errors.gender}</p>}
              </div>
          </div>

          <div className="mt-4 mb-2 flex items-center justify-center gap-6 border border-gray-200 p-4 rounded-xl bg-gray-50">
            <span className="font-bold text-gray-600">I am a:</span>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="role" value="student" className="mr-2 cursor-pointer"
                checked={formData.role === 'student'} onChange={handleChange} /> Student
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="role" value="teacher" className="mr-2 cursor-pointer"
                checked={formData.role === 'teacher'} onChange={handleChange} /> Teacher
            </label>
          </div>

          <input
            type="submit"
            value="Create Account"
            className={`btn w-full mt-4 ${isFormValid ? '' : 'cursor-not-allowed opacity-50'}`}
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