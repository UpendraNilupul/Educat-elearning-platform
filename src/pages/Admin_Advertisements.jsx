import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Trash2, CheckCircle, XCircle, Upload, Plus, Eye, PlayCircle } from 'lucide-react';

const Admin_Advertisements = () => {
    const [advertisements, setAdvertisements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' or 'admin'
    const [errorMsg, setErrorMsg] = useState('');

    const fetchAdvertisements = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            const response = await api.get('/admin/advertisements');
            if (!Array.isArray(response.data)) {
                // This happens if backend returns HTML (e.g. 404 because server wasn't restarted)
                setErrorMsg('Server returned invalid data. Please restart your Node.js backend server so it can register the new /api/admin/advertisements route.');
            }
            setAdvertisements(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching ads:", error);
            toast.error("Failed to fetch advertisements");
            setErrorMsg('Error connecting to the backend API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvertisements();
    }, []);

    const togglePublish = async (id, currentStatus) => {
        try {
            await api.put(`/admin/advertisements/${id}/toggle`, { is_published: !currentStatus });
            toast.success(`Advertisement ${!currentStatus ? 'published' : 'unpublished'}`);
            fetchAdvertisements();
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this advertisement?")) return;
        try {
            await api.delete(`/admin/advertisements/${id}`);
            toast.success("Advertisement deleted successfully");
            fetchAdvertisements();
        } catch (error) {
            console.error('Error deleting advertisement:', error);
            toast.error("Failed to delete advertisement");
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('advertisement', file);
            
            await api.post('/admin/advertisements', formData);
            toast.success('Advertisement uploaded successfully');
            setFile(null);
            document.getElementById('ad-upload-input').value = "";
            fetchAdvertisements();
            setActiveTab('admin'); // switch to admin tab to see it
        } catch (error) {
            console.error('Error uploading advertisement:', error);
            toast.error('Failed to upload advertisement');
        } finally {
            setUploading(false);
        }
    };

    // Filter ads based on active tab
    const safeAds = Array.isArray(advertisements) ? advertisements : [];
    const teacherAds = safeAds.filter(ad => ad.t_id !== null);
    const adminAds = safeAds.filter(ad => ad.t_id === null);
    const displayedAds = activeTab === 'teacher' ? teacherAds : adminAds;

    return (
        <div className="p-8 font-sans bg-gray-50 min-h-screen">
            
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <button 
                        onClick={() => window.location.href = '/admin'}
                        className="flex items-center text-gray-500 hover:text-blue-600 font-bold mb-4 transition-colors"
                    >
                        <span className="mr-2">←</span> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-gray-900">Advertisement Management</h1>
                    <p className="text-gray-500 mt-1">Approve teacher ads or upload your own for the homepage.</p>
                </div>
            </div>

            {/* Admin Upload Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Upload className="text-blue-500" size={20} />
                    Upload Admin Advertisement
                </h2>
                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Image/Video</label>
                        <input 
                            id="ad-upload-input"
                            type="file" 
                            accept="image/*,video/*" 
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-xl p-2 cursor-pointer transition-colors"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={uploading || !file}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {uploading ? 'Uploading...' : <><Plus size={18} /> Upload Advertisement</>}
                    </button>
                </form>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('teacher')}
                    className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'teacher' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Teacher Uploads ({teacherAds.length})
                </button>
                <button
                    onClick={() => setActiveTab('admin')}
                    className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Admin Uploads ({adminAds.length})
                </button>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm mb-4">
                    <p className="font-bold flex items-center gap-2"><XCircle size={18} /> Error loading data</p>
                    <p className="text-sm mt-1">{errorMsg}</p>
                </div>
            )}

            {/* Ads Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Loading advertisements...</div>
            ) : displayedAds.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">No advertisements found in this section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedAds.map((ad) => {
                        const isVideo = ad.ad_link.match(/\.(mp4|webm|ogg)$/i);
                        
                        return (
                            <div key={ad.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
                                <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                    {isVideo ? (
                                        <>
                                            <video src={ad.ad_link} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <PlayCircle className="text-white opacity-80" size={40} />
                                            </div>
                                        </>
                                    ) : (
                                        <img src={ad.ad_link} alt="Ad" className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-black uppercase tracking-wider shadow-sm ${ad.is_published ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                                            {ad.is_published ? 'Published' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Uploaded By</p>
                                        <p className="text-gray-800 font-black">{ad.teacher_name || 'Admin'}</p>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-auto">
                                        <button 
                                            onClick={() => togglePublish(ad.id, ad.is_published)}
                                            className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-xl font-bold text-sm transition-colors ${ad.is_published ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        >
                                            {ad.is_published ? <><XCircle size={16}/> Unpublish</> : <><CheckCircle size={16}/> Publish</>}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(ad.id)}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-xl transition-colors"
                                            title="Delete Advertisement"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Admin_Advertisements;
