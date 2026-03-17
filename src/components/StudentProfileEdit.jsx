import React, { useState } from 'react';
import { Camera, Save, User, Mail, Phone, Calendar, Users, GraduationCap, Hash, BookOpen, Layers } from 'lucide-react';

const StudentProfileEdit = ({ onClose, initialData = {} }) => {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    dob: initialData.dob || '',
    gender: initialData.gender || '',
    schoolName: initialData.schoolName || '',
    gradeLevel: initialData.gradeLevel || '',
    stream: initialData.stream || '',
    studentId: initialData.studentId || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data to save:', formData);
    // Add API logic here
    
    // Simulate successful save and close the modal
    if (onClose) {
      onClose();
    }
  };

  const inputClassName = "w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white/60 backdrop-blur-sm";
  const labelClassName = "block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2";

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-gray-500 mt-1">Manage your personal and academic information.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Photo Section */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="relative group">
             <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-purple-400">
                <User className="w-10 h-10" />
             </div>
             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                 <Camera className="w-6 h-6 text-white" />
             </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
            <p className="text-sm text-gray-500 mb-3">Upload a professional looking portrait.</p>
            <div className="relative inline-block">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept="image/*"
              />
              <button type="button" className="px-5 py-2.5 bg-purple-50 text-brand-purple hover:bg-purple-100 font-semibold text-sm rounded-lg transition-colors border border-purple-200">
                Upload Photo
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Personal Information */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-xl">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className={labelClassName}>
                  <User className="w-4 h-4 text-gray-400" /> Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className={labelClassName}>
                  <Mail className="w-4 h-4 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className={labelClassName}>
                  <Phone className="w-4 h-4 text-gray-400" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>
                    <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    <Users className="w-4 h-4 text-gray-400" /> Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={inputClassName}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Academic Information */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Academic Information</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className={labelClassName}>
                  <BookOpen className="w-4 h-4 text-gray-400" /> School/University
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="e.g. Springfield High School"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClassName}>
                    <Layers className="w-4 h-4 text-gray-400" /> Grade/Level
                  </label>
                  <input
                    type="text"
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="e.g. 12th Grade"
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    <Hash className="w-4 h-4 text-gray-400" /> Student ID
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="e.g. STU-12003"
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>
                  <BookOpen className="w-4 h-4 text-gray-400" /> Stream/Subject
                </label>
                <input
                  type="text"
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="e.g. Science, Arts, Computer Science"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="flex justify-end pt-2 pb-6">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-purple transition-all shadow-lg hover:shadow-brand-purple/30 active:scale-95"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
};

export default StudentProfileEdit;
