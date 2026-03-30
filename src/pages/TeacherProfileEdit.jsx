import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TeacherProfileEdit = ({ teacherId }) => {
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

    axios.get(`http://localhost:3000/api/teacher/${resolvedTeacherId}`, { withCredentials: true })
      .then(res => {
        setFormData(prev => ({
          ...prev,
          ...res.data,
          dob: res.data.dob ? res.data.dob.split('T')[0] : '',
          highest_qualification: res.data.highest_qualification || '',
          university: res.data.university || '',
          experience_years: res.data.experience_years || '',
          bio: res.data.bio || '',
          '2fa_enabled': res.data['2fa_enabled'] === 1 || res.data['2fa_enabled'] === true
        }));
        if (res.data.picture) setPreview(`http://localhost:3000/uploads/${res.data.picture}`);
      })
      .catch(err => {
        console.error('Failed to load teacher profile', err);
        setMessage({ type: 'error', text: 'Failed to load profile.' });
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
      const res = await axios.put(`http://localhost:3000/api/teacher/${resolvedTeacherId}`, data, { withCredentials: true });
      setMessage({ type: 'success', text: res.data.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to update teacher profile', err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
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
        {/* Name */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        {/* Profile Picture */}
        <div>
          <label className="block text-gray-600 font-medium mb-1">Profile Picture</label>
          <input
            type="file"
            name="picture"
            accept="image/*"
            onChange={handleChange}
            className="block w-full text-gray-700"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 w-32 h-32 object-cover rounded-full border border-gray-300"
            />
          )}
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
