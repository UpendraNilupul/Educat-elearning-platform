import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';

const TeacherAdvertisements = () => {
    const [advertisements, setAdvertisements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchAdvertisements = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/teacher/advertisements');
            setAdvertisements(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching advertisements:', error);
            toast.error('Failed to load advertisements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvertisements();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('advertisement', selectedFile);

            await api.post('/teacher/advertisements', formData);

            toast.success('Advertisement uploaded successfully');
            setSelectedFile(null);
            setPreviewUrl(null);
            fetchAdvertisements(); // Refresh list
        } catch (error) {
            console.error('Error uploading advertisement:', error);
            toast.error('Failed to upload advertisement');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this advertisement?')) return;

        try {
            await api.delete(`/teacher/advertisements/${id}`);
            toast.success('Advertisement deleted');
            fetchAdvertisements();
        } catch (error) {
            console.error('Error deleting advertisement:', error);
            toast.error('Failed to delete advertisement');
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Advertisements</h1>
                <p className="text-gray-500 mt-2">Manage your promotional banners that appear on the homepage.</p>
            </div>

            {/* Upload Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Upload New Advertisement</h2>
                
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <label 
                            htmlFor="ad-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-purple-500 mb-3" />
                                <p className="mb-2 text-sm text-purple-700 font-semibold">Click to upload or drag and drop</p>
                                <p className="text-xs text-purple-500">PNG, JPG, JPEG (Max 5MB)</p>
                            </div>
                            <input 
                                id="ad-upload" 
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/jpg" 
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {previewUrl && (
                        <div className="w-full md:w-1/3 flex flex-col gap-3">
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-video">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full py-2.5 bg-[#4a0b59] text-white rounded-xl font-bold hover:bg-[#3a0947] transition-colors flex items-center justify-center gap-2"
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Advertisement'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Existing Advertisements */}
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Active Advertisements</h2>
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : advertisements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {advertisements.map((ad) => (
                        <div key={ad.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group relative">
                            <div className="aspect-video relative">
                                <img src={ad.ad_link} alt="Advertisement" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => handleDelete(ad.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-2xl p-12 flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
                    <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No advertisements uploaded yet.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherAdvertisements;
