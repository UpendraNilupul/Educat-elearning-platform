import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'; // 🌟 THE FIX: Import the API instance

const TeacherProfileEdit = ({ teacherId, setUserName, setUserPicture }) => {
  const params = useParams();
  const navigate = useNavigate();
  const resolvedTeacherId = teacherId || params.id || localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    dob: '',
    gender: '',
    highest_qualification: '',
    university: '',
    experience_years: '',
    bio: '',
    picture: null,
    '2fa_enabled': false,
  });

  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Fetch teacher info on mount
  useEffect(() => {
    if (!resolvedTeacherId) {
      setMessage({ type: 'error', text: 'Teacher ID not found, please login again.' });
      return;
    }

    // 🌟 THE FIX: Use api.get()
    api.get(`/teacher/${resolvedTeacherId}`)
      .then(res => {
        setFormData(prev => ({
          ...prev,
          ...res.data,
          dob: res.data.dob ? res.data.dob.split('T')[0] : '',
          gender: res.data.gender ? res.data.gender.toLowerCase() : '',
          highest_qualification: res.data.highest_qualification || '',
          university: res.data.university || '',
          experience_years: res.data.experience_years || '',
          bio: res.data.bio || '',
          '2fa_enabled': res.data['2fa_enabled'] === 1 || res.data['2fa_enabled'] === true
        }));
        
        // 🌟 COMBINED FIX: Handle Cloudinary full URLs AND dynamic base URLs for local files
        if (res.data.picture) {
          const pic = res.data.picture;
          const baseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
          setPreview(pic.startsWith('http') ? pic : `${baseURL}/uploads/profiles/${pic}`);
        }
      })
      .catch(err => {
        console.error('Failed to load teacher profile', err);
        setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load profile.' });
      });
  }, [resolvedTeacherId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    }

    try {
      // 🌟 THE FIX: Use api.put() - Axios automatically handles the FormData headers!
      const res = await api.put(`/teacher/${resolvedTeacherId}`, data);
      setMessage({ type: 'success', text: res.data.message });
      
      // Keep the frontend dashboard and header in sync with the new database Name and Picture!
      if (typeof setUserName === 'function') {
        setUserName(formData.name);
      }
      localStorage.setItem('userName', formData.name);

      if (typeof setUserPicture === 'function' && res.data.pictureUrl) {
        setUserPicture(res.data.pictureUrl);
        localStorage.setItem('userPicture', res.data.pictureUrl);
      } else if (typeof setUserPicture === 'function' && res.data.picture) {
        // Fallback for legacy filenames
        setUserPicture(res.data.picture);
        localStorage.setItem('userPicture', res.data.picture);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to update teacher profile', err);
      // Show actual error message from server if available
      const errorMsg = err.response?.data?.error || 'Failed to update profile.';
      setMessage({ type: 'error', text: errorMsg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-700">Edit Teacher Profile</h2>

      {message.text && (
        <div
          className={`mb-4 px-4 py-2 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
        {/* Profile Picture Preview & Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <img
              src={preview || `https://ui-avatars.com/api/?name=${formData.name.replace(/ /g, '+')}&background=4a0b59&color=fff&size=128`}
              alt="Profile"
              className="w-32 h-32 object-cover rounded-full border-4 border-purple-100 shadow-md transition-transform group-hover:scale-105"
            />
            <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 shadow-lg transition-colors">
              <input
                type="file"
                name="picture"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">Click the icon to change profile picture</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Phone Number</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Highest Qualification */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Highest Qualification</label>
          <input
            type="text"
            name="highest_qualification"
            value={formData.highest_qualification}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. MSc in Computer Science"
          />
        </div>

        {/* University */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">University</label>
          <input
            type="text"
            name="university"
            value={formData.university}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Experience Years */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Years of Experience</label>
          <input
            type="number"
            name="experience_years"
            value={formData.experience_years}
            onChange={handleChange}
            min="0"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Bio */}
        <div className="md:col-span-1 lg:col-span-1">
          <label className="block text-gray-600 font-medium mb-1">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="4"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Tell us a bit about yourself..."
          ></textarea>
        </div>


        {/* 2FA */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="2fa_enabled"
            checked={formData['2fa_enabled']}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-gray-700 font-medium">Enable 2FA</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-500 text-white px-6 py-2 rounded font-medium mt-2 hover:bg-blue-700 transition-colors duration-200 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default TeacherProfileEdit;