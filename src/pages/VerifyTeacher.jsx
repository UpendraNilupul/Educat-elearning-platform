import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, MessageSquare } from 'lucide-react';
import api from '../api';

const VerifyTeacher = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({ nic: null, cv: null });
  const [notifications, setNotifications] = useState([]);
  const [submittedDocs, setSubmittedDocs] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch notifications AND real chat messages in parallel
        const [notifRes, statusRes, msgsRes] = await Promise.all([
          api.get(`/notifications/${userId}`),
          api.get(`/teacher-status/${userId}`),
          api.get(`/teacher-messages/${userId}`)
        ]);

        // Real messages from the messages table (have actual body text)
        const realMsgs = msgsRes.data?.success ? msgsRes.data.data : [];
        // Fallback: notifications table (may have stale "New message from Admin" text)
        const notifs   = notifRes.data?.success ? notifRes.data.data : [];

        // Prefer real messages; if none exist yet fall back to notifications
        const combined = realMsgs.length > 0 ? realMsgs : notifs;
        setNotifications(combined);
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

  const getNotificationText = (note) => {
    if (!note) return "";
    // Priority order: real message content/body/text > reason > feedback > description
    const text =
      note.body ??
      note.content ??
      note.message ??
      note.text ??
      note.feedback ??
      note.reason ??
      note.data?.body ??
      note.data?.content ??
      note.data?.message ??
      note.data?.text ??
      note.description ??
      note.data?.description ??
      "";

    return String(text);
  };

  const getNotificationTitle = (note) => {
    if (!note) return "Notification";
    return (
      note.title ??
      note.data?.title ??
      note.subject ??
      "Notification"
    );
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
            {notifications.map((note, index) => {
              const textContent = getNotificationText(note);
              const isSelected = selectedNote?.id === note.id;

              return (
                <div
                  key={note.id || note._id || index}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                    isSelected
                      ? 'bg-orange-100/80 border-orange-400 ring-2 ring-orange-300'
                      : 'bg-orange-50 hover:bg-orange-100/50 border-orange-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-orange-900 break-words text-sm flex items-center">
                      <MessageSquare size={15} className="mr-1.5 text-orange-600 shrink-0" />
                      {getNotificationTitle(note)}
                    </h4>
                    <span className="text-[11px] text-orange-500 font-medium ml-2 shrink-0 bg-orange-100 px-2 py-0.5 rounded-full">
                      View
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap break-words leading-relaxed font-normal">
                    {textContent || "Click to view full message details"}
                  </p>

                  <span className="text-xs text-orange-400 mt-2.5 block font-medium">
                    {note.created_at || note.createdAt || note.timestamp
                      ? new Date(note.created_at || note.createdAt || note.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })
                      : 'Just now'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No messages found.</p>
        )}
      </div>

      {/* Message Detail Modal when a notification card is clicked */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getNotificationTitle(selectedNote)}</h3>
                  <span className="text-xs text-gray-400">
                    {selectedNote.created_at || selectedNote.createdAt
                      ? new Date(selectedNote.created_at || selectedNote.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNote(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 text-gray-800 text-sm whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto custom-scrollbar">
              {getNotificationText(selectedNote) || (
                <span className="italic text-gray-400">No message body provided.</span>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedNote(null)}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyTeacher;