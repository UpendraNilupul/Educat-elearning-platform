import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyTeacher = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({ nic: null, cv: null });

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nic', files.nic);
    formData.append('cv', files.cv);

    try {
      await axios.post(`/api/upload-docs/${userId}`, formData);
      alert("Submission successful! Please wait for admin approval.");
      navigate('/login');
    } catch (err) {
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleUpload} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Teacher Verification</h2>
        <p className="text-gray-500 mb-6">Upload your NIC and CV to complete your application.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">NIC Photo (Front)</label>
          <input type="file" onChange={(e) => setFiles({...files, nic: e.target.files[0]})} required className="w-full border p-2 rounded" />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Teacher CV (PDF)</label>
          <input type="file" onChange={(e) => setFiles({...files, cv: e.target.files[0]})} required className="w-full border p-2 rounded" />
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold cursor-pointer"
        >
          Submit Documents
        </button>
      </form>
    </div>
  );
};

export default VerifyTeacher;