import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Download, BookOpen, Clock, AlertCircle, 
    CheckCircle2, FileText, UploadCloud
} from 'lucide-react';
import api from '../api';
import { forceDownload } from '../utils/downloadHelper';

const AssignmentSubmissionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [submissionFile, setSubmissionFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);
    
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchAssignmentDetails();
    }, [id]);

    const fetchAssignmentDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/assignments/${id}`);
            setAssignment(response.data);
        } catch (err) {
            console.error("Failed to fetch assignment:", err);
            alert("Could not load assignment details.");
            navigate('/assessments');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();
        if (!submissionFile) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('submission', submissionFile);
            formData.append('userId', userId);
            formData.append('type', 'submission');

            await api.post(`/assignments/${id}/submit`, formData);

            alert("Assignment submitted successfully!");
            setSubmissionFile(null);
            setIsResubmitting(false); // 🌟 Lock the form back after resubmitting!
            fetchAssignmentDetails(); // Refresh to get updated submission status
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Submission failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 min-h-screen flex items-center justify-center">Loading assignment details...</div>;
    if (!assignment) return null;

    const isPastDeadline = new Date(assignment.deadline) < new Date();
    const hasSubmitted = !!assignment.userSubmission;
    const isGraded = assignment.userSubmission?.status === 'graded';
    
    // Lock submission if already submitted, unless they clicked "Resubmit"
    const canSubmit = (!hasSubmitted || isResubmitting) && !isGraded && !isPastDeadline;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate('/student')}
                    className="group mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                {/* Header Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                    Assignment
                                </span>
                                {isPastDeadline && !hasSubmitted && (
                                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                        <AlertCircle size={10} /> Past Due
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-black text-gray-900">{assignment.title}</h1>
                        </div>
                        <div className="text-left md:text-right bg-gray-50 p-4 rounded-2xl border border-gray-100 min-w-[200px]">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                            <p className="text-lg font-bold text-gray-900 flex items-center gap-2 md:justify-end">
                                <Clock size={16} className="text-purple-600" />
                                {new Date(assignment.deadline).toLocaleDateString()}
                            </p>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm font-bold text-gray-600">{assignment.max_marks} Points Max</p>
                            </div>
                        </div>
                    </div>

                    <div className="prose max-w-none">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                            <BookOpen size={20} className="text-purple-600" /> Instructions
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {assignment.description || "No instructions provided."}
                        </div>
                    </div>

                    {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                                <FileText size={20} className="text-purple-600" /> Reference Materials
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {assignment.attachments.map(att => (
                                    <button 
                                        key={att.id} 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const originalName = att.file_url.split('/').pop() || 'Reference_Material';
                                            forceDownload(att.file_url, originalName);
                                        }}
                                        className="flex items-center justify-between p-4 bg-white border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 rounded-xl transition-all group w-full text-left"
                                    >
                                        <span className="text-sm font-semibold text-gray-700 truncate mr-4">
                                            {att.file_url.split('/').pop()}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Download size={14} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submission Status Section */}
                {hasSubmitted && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-green-600" /> Your Submission
                        </h3>
                        
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="text-sm font-bold text-green-800 capitalize">Status: {assignment.userSubmission.status.replace('_', ' ')}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    Submitted on {new Date(assignment.userSubmission.submitted_at).toLocaleString()}
                                </p>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    forceDownload(assignment.userSubmission.file_url, `My_Submission_${assignment.title.replace(/\\s+/g, '_')}`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg font-bold shadow-sm border border-green-200 hover:bg-green-100 transition-colors text-sm"
                            >
                                <Download size={16} /> Download Uploaded File
                            </button>
                        </div>

                        {isGraded && (
                            <div className="mt-4 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-purple-900 uppercase tracking-wider">Teacher's Grade</span>
                                    <span className="text-2xl font-black text-purple-700">{assignment.userSubmission.grade} <span className="text-lg text-purple-400">/ {assignment.max_marks}</span></span>
                                </div>
                                {assignment.userSubmission.feedback && (
                                    <div className="mt-4 pt-4 border-t border-purple-200">
                                        <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Feedback</p>
                                        <p className="text-sm text-purple-800 italic">"{assignment.userSubmission.feedback}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* File Upload Form Section */}
                {canSubmit ? (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <UploadCloud size={20} className="text-purple-600" /> 
                                {hasSubmitted ? "Upload New Version (Resubmit)" : "Upload Your Work"}
                            </h3>
                            {hasSubmitted && (
                                <button 
                                    onClick={() => setIsResubmitting(false)}
                                    className="text-sm font-bold text-gray-400 hover:text-gray-600"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                        
                        <form onSubmit={handleAssignmentSubmit}>
                            <div className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-2xl p-10 text-center bg-gray-50 hover:bg-purple-50/30 transition-colors cursor-pointer group relative mb-6">
                                <input
                                    type="file"
                                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    required
                                />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={32} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {submissionFile ? submissionFile.name : "Click to browse or drag file here"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">
                                        Supported formats: PDF, DOCX, ZIP, JPG, PNG (Max 15MB)
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !submissionFile}
                                    className="px-8 py-4 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isSubmitting ? "Uploading..." : hasSubmitted ? "Resubmit Assignment" : "Submit Assignment"}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className={`${hasSubmitted ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'} rounded-3xl p-8 text-center border`}>
                        {hasSubmitted ? (
                            <>
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-green-900 mb-1">Document Uploaded</h3>
                                <p className="text-green-700 mb-4">
                                    {isGraded ? "This assignment has been graded." : "Your submission has been recorded and is locked."}
                                </p>
                                {!isGraded && !isPastDeadline && (
                                    <button 
                                        onClick={() => setIsResubmitting(true)}
                                        className="px-6 py-2.5 bg-white border border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors shadow-sm"
                                    >
                                        Resubmit Assignment
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Submissions Closed</h3>
                                <p className="text-gray-500">
                                    The deadline for this assignment has passed.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentSubmissionPage;
