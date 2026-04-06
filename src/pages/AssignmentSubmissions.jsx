import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Download, 
    CheckCircle, 
    Clock, 
    User, 
    FileText,
    Send,
    AlertCircle
} from 'lucide-react';

const AssignmentSubmissions = () => {
    const { id } = useParams(); // assignment id
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gradingData, setGradingData] = useState({ id: null, grade: '', feedback: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch assignment details (We'll use the module assignments fetcher or a specific one)
                // For now, let's assume we have an endpoint for single assignment
                const assignRes = await fetch(`http://localhost:3000/api/assignments/${id}`);
                if (assignRes.ok) {
                    const data = await assignRes.json();
                    setAssignment(data);
                }

                // Fetch submissions
                const subRes = await fetch(`http://localhost:3000/api/assignments/${id}/submissions`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    setSubmissions(subData);
                }
            } catch (err) {
                console.error("Error fetching submissions:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleGradeSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:3000/api/submissions/${gradingData.id}/grade`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade: gradingData.grade, feedback: gradingData.feedback })
            });

            if (response.ok) {
                setSubmissions(submissions.map(s => 
                    s.id === gradingData.id ? { ...s, grade: gradingData.grade, feedback: gradingData.feedback, status: 'graded' } : s
                ));
                setGradingData({ id: null, grade: '', feedback: '' });
                alert("Grade submitted successfully!");
            }
        } catch (err) {
            console.error("Error grading:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-purple-600">Loading submissions...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <button 
                onClick={() => navigate('/teacher')}
                className="flex items-center gap-2 text-gray-500 hover:text-purple-600 mb-6 font-medium transition-colors"
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{assignment?.title || 'Assignment Submissions'}</h1>
                        <p className="text-gray-500 max-w-2xl">{assignment?.description}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Max Marks</span>
                        <span className="text-2xl font-black text-purple-600">{assignment?.max_marks || 100}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submissions List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <User size={20} className="text-purple-500" /> Students ({submissions.length})
                    </h2>
                    
                    {submissions.length === 0 ? (
                        <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                            <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No submissions yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className={`bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${gradingData.id === sub.id ? 'border-purple-600 shadow-md' : 'border-gray-100 hover:border-purple-200'}`} onClick={() => setGradingData({ id: sub.id, grade: sub.grade || '', feedback: sub.feedback || '' })}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center font-bold text-purple-700">
                                            {sub.student_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{sub.student_name}</h4>
                                            <p className="text-xs text-gray-500">{sub.student_email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {sub.status === 'graded' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                            {sub.status}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(sub.submitted_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                                    <a 
                                        href={`http://localhost:3000${sub.file_url}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:underline"
                                    >
                                        <Download size={16} /> Download Submission
                                    </a>
                                    {sub.grade !== null && (
                                        <div className="bg-purple-50 px-3 py-1 rounded-lg text-sm font-black text-purple-700">
                                            Score: {sub.grade} / {assignment?.max_marks}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Grading Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg sticky top-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Send size={20} className="text-purple-600" /> Grading Panel
                        </h2>
                        
                        {gradingData.id ? (
                            <form onSubmit={handleGradeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Marks Obtained</label>
                                    <input 
                                        type="number" 
                                        max={assignment?.max_marks}
                                        value={gradingData.grade}
                                        onChange={e => setGradingData({...gradingData, grade: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                                        placeholder={`Out of ${assignment?.max_marks}`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Feedback</label>
                                    <textarea 
                                        value={gradingData.feedback}
                                        onChange={e => setGradingData({...gradingData, feedback: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-100 focus:border-purple-600 outline-none transition-all"
                                        placeholder="Add encouragement or areas of improvement..."
                                        rows={5}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : "Submit Grade"}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setGradingData({ id: null, grade: '', feedback: '' })}
                                    className="w-full text-gray-500 text-sm font-bold mt-2"
                                >
                                    Cancel
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl">
                                <FileText size={40} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 text-sm font-medium">Select a student from the list to start grading.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentSubmissions;
