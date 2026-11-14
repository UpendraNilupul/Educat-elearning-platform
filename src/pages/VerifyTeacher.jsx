import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api'; // 🌟 THE FIX: Import your Axios instance

const VerifyTeacher = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({ nic: null, cv: null });
  const [notifications, setNotifications] = useState([]);
  const [submittedDocs, setSubmittedDocs] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🌟 THE FIX: Use Promise.all with api.get to fetch both concurrently without hardcoded URLs
        const [notifRes, statusRes] = await Promise.all([
          api.get(`/notifications/${userId}`),
          api.get(`/teacher-status/${userId}`)
        ]);

        if (notifRes.data.success) {
          setNotifications(notifRes.data.data);
        }
        if (statusRes.data.success && statusRes.data.data) {
          setSubmittedDocs({
            nic: statusRes.data.data.nic_path,
            cv: statusRes.data.data.resume_link,
            status: statusRes.data.data.verification_status
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (submittedDocs && !files.nic && !files.cv) {
      alert("Please select at least one new document to update.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    if (files.nic) formData.append('nic', files.nic);
    if (files.cv) formData.append('cv', files.cv);

    // Safeguard: Check if userId is actually a value
    if (!userId || userId === "null" || userId === "undefined") {
        alert("System Error: No User ID found. Please try logging in again.");
        setIsSubmitting(false);
        return;
    }

    try {
      // 🌟 COMBINED FIX: Use api.post (from HEAD) + logging (from Dev)
      const response = await api.post(`/upload-docs/${userId}`, formData);
      console.log("Upload Success:", response.data);
      
      alert(submittedDocs ? "Documents updated successfully!" : "Submission successful! Please wait for admin approval.");
      navigate('/login');
    } catch (err) {
      console.error("Upload Detailed Error:", err);
      // 🌟 COMBINED FIX: Better error extraction
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Upload failed. Please try again.";
      alert("Upload failed: " + errorMsg);
    } finally {
      // 🌟 COMBINED FIX: Ensure button re-enables (from Dev)
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-10 px-4 relative">
      <form onSubmit={handleUpload} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md z-10">
        <h2 className="text-2xl font-bold mb-4">Teacher Verification</h2>
        <p className="text-gray-500 mb-6">Upload your NIC and CV (Photo or PDF) to complete your application.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">NIC (Photo or PDF)</label>
          {submittedDocs?.nic && (
            <p className="text-sm text-green-600 mb-2 font-medium">
              ✓ Document previously submitted
            </p>
          )}
          <input type="file" onChange={(e) => setFiles({...files, nic: e.target.files[0]})} required={!submittedDocs?.nic} className="w-full border p-2 rounded" accept="image/*,application/pdf" />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Teacher CV (Photo or PDF)</label>
          {submittedDocs?.cv && (
            <p className="text-sm text-green-600 mb-2 font-medium">
              ✓ Document previously submitted
            </p>
          )}
          <input type="file" onChange={(e) => setFiles({...files, cv: e.target.files[0]})} required={!submittedDocs?.cv} className="w-full border p-2 rounded" accept="image/*,application/pdf" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full transition-colors text-white py-3 rounded-xl font-bold ${
            isSubmitting 
            ? 'bg-orange-300 cursor-not-allowed' 
            : 'bg-orange-600 hover:bg-orange-700 cursor-pointer'
          }`}
        >
          {isSubmitting ? 'Uploading Documents...' : (submittedDocs ? 'Update Documents' : 'Submit Documents')}
        </button>
      </form>

      {/* Floating Message Box automatically positioned bottom right */}
      <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white p-6 rounded-xl shadow-2xl border-l-4 border-orange-500 z-50">
        <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
          <span className="mr-2">🔔</span> Messages
        </h3>
        {notifications.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {notifications.map((note) => (
              <div key={note.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h4 className="font-semibold text-orange-900 break-words text-sm">
                  {note.title || "New Message"}
                </h4>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
                  {note.description || note.content || note.message || note.text || "New message from Admin"}
                </p>
                <span className="text-xs text-orange-400 mt-2 block font-medium">
                  {note.created_at
                    ? new Date(note.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                      })
                    : 'Just now'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No messages found.</p>
        )}
      </div>
    </div>
  );
};

export default VerifyTeacher;