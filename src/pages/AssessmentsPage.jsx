import React, { useState, useEffect } from 'react';
import {
    ClipboardList, BookOpen, Clock, ChevronRight,
    ChevronLeft, X, CheckCircle2, Trophy, AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api'; // 🌟 THE FIX: Using your configured Axios instance!

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-red-600 bg-red-100 min-h-screen">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
                    <pre className="whitespace-pre-wrap mt-4">{this.state.error?.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const AssessmentsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('pending');
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Quiz Player State
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [studentAnswers, setStudentAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isReviewMode, setIsReviewMode] = useState(false);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchAssessments();
    }, [userId]);

    // Timer Effect
    useEffect(() => {
        if (!activeQuiz || timeLeft === null || quizResult) return;

        if (timeLeft <= 0) {
            handleSubmitQuiz();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [activeQuiz, timeLeft, quizResult]);

    // Auto-save Effect
    useEffect(() => {
        if (activeQuiz && !isReviewMode && !quizResult) {
            const saveProgress = async () => {
                try {
                    await api.put(`/quizzes/${activeQuiz.id}/progress`, {
                        userId,
                        savedState: { studentAnswers, currentQuestionIdx }
                    });
                } catch (err) {
                    console.error("Failed to save progress", err);
                }
            };
            const timerId = setTimeout(saveProgress, 1000);
            return () => clearTimeout(timerId);
        }
    }, [studentAnswers, currentQuestionIdx, activeQuiz, isReviewMode, quizResult]);

    useEffect(() => {
        fetchAssessments();
    }, [userId]);

    // 🌟 THE FIX: Switched from generic axios to api.get
    const fetchAssessments = async () => {
        try {
            setLoading(true);
            // api instance automatically handles baseURL and withCredentials!
            const response = await api.get(`/student/my-assessments`);
            setAssessments(response.data);
        } catch (err) {
            console.error("Failed to fetch assessments:", err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-start quiz if navigated from Class page
    useEffect(() => {
        if (location.state?.startQuizId && assessments.length > 0 && !activeQuiz) {
            const targetId = location.state.startQuizId;
            const quizToStart = assessments.find(a => a.id === targetId && a.type === 'Quiz');
            if (quizToStart) {
                if (quizToStart.status === 'completed') {
                    handleReviewQuiz(quizToStart.id);
                } else {
                    handleStartQuiz(quizToStart);
                }
                // Clear state to prevent looping on close/reload
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [assessments, location.state, activeQuiz, navigate]);

    const handleStartQuiz = async (quiz) => {
        try {
            const resp = await api.post(`/quizzes/${quiz.id}/start`, { userId });
            const data = resp.data;

            if (typeof data === 'string' && data.startsWith('<!DOCTYPE')) {
                throw new Error("Backend returned HTML instead of JSON. The backend server might need to be restarted to load the new routes.");
            }
            if (!data || typeof data !== 'object' || !Array.isArray(data.questions)) {
                throw new Error("Invalid quiz data received from the server. Payload: " + JSON.stringify(data).substring(0, 200));
            }

            setActiveQuiz(data);
            setCurrentQuestionIdx(data.savedState?.currentQuestionIdx || 0);
            setStudentAnswers(data.savedState?.studentAnswers || {});
            setQuizResult(null);
            setIsReviewMode(false);

            if (data.remainingTime !== null && data.remainingTime !== undefined) {
                setTimeLeft(data.remainingTime);
            } else if (data.time_limit) {
                const parts = data.time_limit.split(':');
                const seconds = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
                setTimeLeft(seconds);
            } else {
                setTimeLeft(null);
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "Failed to load quiz questions.");
        }
    };

    const isPastDeadline = (item) => {
        if (item.type === 'Assignment') {
            return new Date(item.time_limit) < new Date();
        } else if (item.type === 'Quiz' && item.publish_at) {
            const publishDate = new Date(item.publish_at);
            let timeLimitMs = 0;
            if (item.time_limit) {
                const parts = item.time_limit.split(':');
                timeLimitMs = ((parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2])) * 1000;
            }
            return new Date() > new Date(publishDate.getTime() + timeLimitMs);
        }
        return false;
    };

    const handleReviewQuiz = async (quizId) => {
        try {
            const resp = await api.get(`/quizzes/${quizId}/review/${userId}`);
            setActiveQuiz(resp.data.quiz);
            setStudentAnswers(resp.data.studentAnswers);
            setCurrentQuestionIdx(0);
            setIsReviewMode(true);
            setTimeLeft(null); // No timer in review mode
            setQuizResult(null); // Ensure we are looking at questions
        } catch (err) {
            alert("Failed to load quiz review.");
        }
    };

    const handleAnswerSelect = (qId, aId, type) => {
        if (isReviewMode) return;
        if (type === 'multiple') {
            setStudentAnswers(prev => {
                const currentArr = prev[qId] || [];
                if (currentArr.includes(aId)) {
                    return { ...prev, [qId]: currentArr.filter(id => id !== aId) };
                } else {
                    return { ...prev, [qId]: [...currentArr, aId] };
                }
            });
        } else {
            setStudentAnswers(prev => ({
                ...prev,
                [qId]: aId
            }));
        }
    };

    const handleSubmitQuiz = async () => {
        if (!activeQuiz) return;

        setIsSubmitting(true);
        setTimeLeft(null); // Pause timer during submission
        try {
            const answersArray = [];
            Object.entries(studentAnswers).forEach(([qIdStr, val]) => {
                const qId = parseInt(qIdStr);
                if (Array.isArray(val)) {
                    val.forEach(aId => {
                        answersArray.push({ qId, aId: parseInt(aId) });
                    });
                } else {
                    answersArray.push({ qId, aId: parseInt(val) });
                }
            });

            // 🌟 THE FIX: Switched to api.post
            const resp = await api.post(`/quizzes/${activeQuiz.id}/submit`, {
                userId,
                answers: answersArray
            });

            setQuizResult(resp.data);
            fetchAssessments(); // Refresh list to move it to 'completed' tab
        } catch (err) {
            alert("Failed to submit quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your assessments...</div>;

    const quizProgress = activeQuiz ? ((currentQuestionIdx + 1) / (activeQuiz.questions?.length || 1)) * 100 : 0;

    const renderAssessmentCard = (item) => {
        const isLocked = item.publish_at && new Date(item.publish_at) > new Date();
        return (
            <div key={`${item.type}-${item.id}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${item.type === 'Quiz' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {item.type}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {item.status}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">{item.subject}</p>

                    <div className="mt-4 space-y-2 text-sm text-gray-500">
                        {item.deadline && (
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400" />
                                <span>Due: {new Date(item.deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                        {item.time_limit && (
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400" />
                                <span>Time Limit: {item.time_limit}</span>
                            </div>
                        )}
                    </div>
                </div>
                {item.status === 'pending' ? (
                    isLocked ? (
                        <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl mt-6 font-bold cursor-not-allowed border border-gray-200 flex items-center justify-center gap-2 text-xs">
                            <Clock size={14} /> Locked until {new Date(item.publish_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </button>
                    ) : isPastDeadline(item) ? (
                        <button disabled className="w-full bg-red-50 text-red-400 py-2.5 rounded-xl mt-6 font-bold cursor-not-allowed border border-red-100 flex items-center justify-center gap-2 text-xs">
                            <AlertCircle size={14} /> Missed Deadline
                        </button>
                    ) : (
                        <button
                            onClick={() => item.type === 'Quiz' ? handleStartQuiz(item) : navigate(`/student/assignment/${item.id}`)}
                            className="w-full bg-purple-600 text-white py-2.5 rounded-xl mt-6 font-bold hover:bg-purple-700 transition shadow-sm"
                        >
                            {item.type === 'Quiz' ? 'Start Quiz' : 'Start Assignment'}
                        </button>
                    )
                ) : (
                    item.type === 'Quiz' ? (
                        <button
                            onClick={() => handleReviewQuiz(item.id)}
                            className="w-full bg-blue-100 text-blue-700 py-2.5 rounded-xl mt-6 font-bold hover:bg-blue-200 transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <BookOpen size={18} /> Review Quiz
                        </button>
                    ) : item.type !== 'Quiz' && new Date(item.deadline) > new Date() && item.sub_status !== 'graded' ? (
                        <button
                            onClick={() => navigate(`/student/assignment/${item.id}`)}
                            className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl mt-6 font-bold hover:bg-gray-300 transition shadow-sm"
                        >
                            Resubmit Assignment
                        </button>
                    ) : (
                        <div className="mt-6">
                            <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl font-bold cursor-not-allowed">
                                <CheckCircle2 size={18} className="inline mr-2" /> Done
                            </button>

                            {/* Display Marks and Feedback if Graded */}
                            {item.type === 'Assignment' && item.sub_status === 'graded' && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Teacher's Grade</span>
                                        <span className="text-lg font-black text-purple-700">{item.grade} <span className="text-xs text-purple-400">/ {item.max_marks}</span></span>
                                    </div>
                                    {item.feedback && (
                                        <div className="mt-2 pt-2 border-t border-purple-200/50">
                                            <p className="text-xs text-purple-800 italic">"{item.feedback}"</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => navigate(`/student/assignment/${item.id}`)}
                                        className="w-full mt-3 bg-white text-purple-600 border border-purple-200 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        );
    };

    return (
        <div className="p-8 w-full min-h-screen bg-gray-50 relative">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
                <p className="text-gray-600 mt-2">
                    Complete your pending quizzes and assignments to stay on track.
                </p>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 mr-6 text-sm font-medium transition-colors ${activeTab === 'pending' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pending Assessments
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`pb-2 mr-6 text-sm font-medium transition-colors ${activeTab === 'completed' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Completed
                </button>
            </div>

            {activeTab === 'pending' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.filter(item => {
                        const pastDeadline = isPastDeadline(item);
                        const effectiveStatus = (item.status === 'pending' && pastDeadline) ? 'completed' : item.status;
                        return effectiveStatus === 'pending';
                    }).map(renderAssessmentCard)}
                </div>
            ) : (
                <div className="space-y-12">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <BookOpen className="text-blue-500" size={24} /> Completed Quizzes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assessments.filter(item => {
                                const pastDeadline = isPastDeadline(item);
                                const effectiveStatus = (item.status === 'pending' && pastDeadline) ? 'completed' : item.status;
                                return effectiveStatus === 'completed' && item.type === 'Quiz';
                            }).map(renderAssessmentCard)}
                            {assessments.filter(item => {
                                const pastDeadline = isPastDeadline(item);
                                const effectiveStatus = (item.status === 'pending' && pastDeadline) ? 'completed' : item.status;
                                return effectiveStatus === 'completed' && item.type === 'Quiz';
                            }).length === 0 && (
                                <p className="text-gray-500 italic">No completed quizzes yet.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <ClipboardList className="text-purple-500" size={24} /> Completed Assignments
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assessments.filter(item => {
                                const pastDeadline = isPastDeadline(item);
                                const effectiveStatus = (item.status === 'pending' && pastDeadline) ? 'completed' : item.status;
                                return effectiveStatus === 'completed' && item.type === 'Assignment';
                            }).map(renderAssessmentCard)}
                            {assessments.filter(item => {
                                const pastDeadline = isPastDeadline(item);
                                const effectiveStatus = (item.status === 'pending' && pastDeadline) ? 'completed' : item.status;
                                return effectiveStatus === 'completed' && item.type === 'Assignment';
                            }).length === 0 && (
                                <p className="text-gray-500 italic">No completed assignments yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Player Overlay */}
            {activeQuiz && (
                <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 z-[100] flex flex-col items-center justify-center p-4 md:p-8 animate-in zoom-in duration-300 overflow-y-auto">
                    <button
                        onClick={() => setActiveQuiz(null)}
                        className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-gray-800 hover:bg-white shadow-sm transition-all z-50 hover:scale-110 active:scale-95"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border border-white/50 p-6 md:p-10 flex flex-col my-auto max-h-[90vh] overflow-y-auto relative">
                        <header className="mb-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-4">
                                    <div className={`p-3.5 rounded-2xl shadow-sm ${isReviewMode ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600'}`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="leading-tight">{activeQuiz.title} {isReviewMode && <span className="text-lg text-gray-400 font-bold ml-2 bg-gray-100 px-3 py-1 rounded-xl">(Review)</span>}</span>
                                </h2>
                                
                                <div className="flex items-center gap-3">
                                    {isReviewMode && activeQuiz.score !== undefined && (
                                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-green-700 shadow-sm">
                                            <Trophy size={20} className="text-green-500" />
                                            <span>Score: {activeQuiz.score} Marks</span>
                                        </div>
                                    )}
                                    {timeLeft !== null && !quizResult && !isReviewMode && (
                                        <div className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black shadow-sm transition-all duration-300 ${timeLeft <= 60 ? 'bg-red-50 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse border border-red-200' : 'bg-white text-gray-700 border border-gray-100'}`}>
                                            <Clock size={20} className={timeLeft <= 60 ? 'text-red-500' : 'text-purple-500'} />
                                            <span className="tracking-widest text-lg">
                                                {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:
                                                {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
                                                {(timeLeft % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="w-full bg-gray-200/60 h-3.5 rounded-full overflow-hidden shadow-inner relative">
                                <div
                                    className={`${isReviewMode ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500'} h-full transition-all duration-500 ease-out rounded-full relative`}
                                    style={{ width: `${quizProgress}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white/40 to-transparent"></div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span>Question {currentQuestionIdx + 1} of {activeQuiz.questions?.length}</span>
                                <span className={isReviewMode ? 'text-blue-500' : 'text-purple-600'}>{Math.round(quizProgress)}% Complete</span>
                            </div>
                        </header>

                        {!quizResult ? (
                            <main className="flex-1 flex flex-col relative z-10">
                                {activeQuiz.questions?.[currentQuestionIdx] && (
                                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
                                        <div className="mb-8 bg-white/60 p-6 md:p-8 rounded-3xl border border-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] backdrop-blur-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-sm">
                                                    {currentQuestionIdx + 1}
                                                </span>
                                                <span className="px-3 py-1 bg-gray-100/80 text-gray-500 font-bold text-xs uppercase tracking-widest rounded-lg">
                                                    {activeQuiz.questions[currentQuestionIdx].marks} Marks
                                                </span>
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-black text-gray-800 leading-snug">
                                                {activeQuiz.questions[currentQuestionIdx].question}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                                            {activeQuiz.questions[currentQuestionIdx].type === 'dropdown' ? (
                                                <div className="md:col-span-2">
                                                    <select
                                                        disabled={isReviewMode}
                                                        className={`w-full p-5 rounded-2xl border-2 outline-none transition-all text-lg font-bold bg-white disabled:opacity-90 appearance-none cursor-pointer shadow-sm ${isReviewMode ? 'border-gray-200 text-gray-800' : 'border-gray-100 hover:border-purple-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-gray-700'}`}
                                                        value={studentAnswers[activeQuiz.questions[currentQuestionIdx].id] || ""}
                                                        onChange={(e) => handleAnswerSelect(activeQuiz.questions[currentQuestionIdx].id, parseInt(e.target.value), 'dropdown')}
                                                    >
                                                        <option value="" disabled>Select your answer...</option>
                                                        {activeQuiz.questions[currentQuestionIdx].options?.map((opt) => (
                                                            <option key={opt.id} value={opt.id}>
                                                                {opt.answer} {isReviewMode && opt.correct ? ' (✓ Correct Answer)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                activeQuiz.questions[currentQuestionIdx].options?.map((opt) => {
                                                    const qId = activeQuiz.questions[currentQuestionIdx].id;
                                                    const qType = activeQuiz.questions[currentQuestionIdx].type;
                                                    const isSelected = qType === 'multiple'
                                                        ? (studentAnswers[qId] || []).includes(opt.id)
                                                        : studentAnswers[qId] === opt.id;

                                                    let borderClass = 'border-white hover:border-purple-200 hover:shadow-md';
                                                    let bgClass = 'bg-white hover:bg-purple-50/50';
                                                    let textClass = 'text-gray-700 group-hover:text-purple-900';
                                                    let iconClass = 'border-gray-200 group-hover:border-purple-300 bg-gray-50';

                                                    if (isReviewMode) {
                                                        bgClass = 'bg-white';
                                                        if (opt.correct) {
                                                            borderClass = 'border-emerald-500 ring-4 ring-emerald-100 shadow-sm z-10';
                                                            bgClass = 'bg-gradient-to-br from-emerald-50 to-white';
                                                            textClass = 'text-emerald-900 font-black';
                                                            iconClass = 'border-emerald-500 bg-emerald-500 shadow-sm';
                                                        } else if (isSelected && !opt.correct) {
                                                            borderClass = 'border-red-400 ring-2 ring-red-50';
                                                            bgClass = 'bg-red-50/50';
                                                            textClass = 'text-red-800 line-through opacity-80';
                                                            iconClass = 'border-red-400 bg-red-400';
                                                        } else {
                                                            borderClass = 'border-gray-100 bg-gray-50/50 opacity-60';
                                                            textClass = 'text-gray-400';
                                                            iconClass = 'border-gray-200 bg-gray-100';
                                                        }
                                                    } else if (isSelected) {
                                                        borderClass = 'border-purple-600 bg-gradient-to-br from-purple-50 to-white ring-4 ring-purple-100 shadow-md scale-[1.02] z-10';
                                                        textClass = 'text-purple-900 font-black';
                                                        iconClass = 'border-purple-600 bg-purple-600 shadow-sm';
                                                        bgClass = ''; // Overridden by borderClass gradient
                                                    }

                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            disabled={isReviewMode}
                                                            onClick={() => handleAnswerSelect(qId, opt.id, qType)}
                                                            className={`w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group ${borderClass} ${bgClass} ${isReviewMode ? 'cursor-default' : 'hover:-translate-y-1'}`}
                                                        >
                                                            {qType === 'multiple' ? (
                                                                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${iconClass}`}>
                                                                    {(isSelected || (isReviewMode && opt.correct)) && <CheckCircle2 size={18} strokeWidth={3} className={isReviewMode && opt.correct && !isSelected ? "text-white" : "text-white"} />}
                                                                </div>
                                                            ) : (
                                                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${iconClass}`}>
                                                                    {(isSelected || (isReviewMode && opt.correct)) && <div className={`w-3 h-3 rounded-full ${isReviewMode && opt.correct && !isSelected ? "bg-white" : "bg-white"}`} />}
                                                                </div>
                                                            )}
                                                            <span className={`text-[1.05rem] leading-snug ${textClass}`}>
                                                                {opt.answer}
                                                            </span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </main>
                        ) : (
                            <main className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-700 delay-100 py-10">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 blur-[40px] opacity-20 rounded-full"></div>
                                    <div className="w-32 h-32 bg-gradient-to-br from-yellow-50 to-amber-100 border-4 border-white shadow-xl text-yellow-500 rounded-full flex items-center justify-center mb-8 relative z-10">
                                        <Trophy size={64} className="drop-shadow-sm" />
                                    </div>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">Quiz Completed!</h2>
                                <p className="text-gray-500 mb-10 max-w-sm text-lg">
                                    Awesome job! Your results have been calculated and securely saved.
                                </p>

                                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Final Score</p>
                                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-indigo-600 filter drop-shadow-sm transition-transform group-hover:scale-110 duration-500">
                                        {quizResult.score} <span className="text-2xl text-gray-300 font-bold tracking-normal">Marks</span>
                                    </div>
                                    <div className="mt-8 flex items-center justify-center gap-2 text-emerald-600 font-black bg-emerald-50/80 border border-emerald-100 py-3 px-6 rounded-xl w-max mx-auto shadow-sm">
                                        <CheckCircle2 size={18} strokeWidth={3} /> Submitted Successfully
                                    </div>
                                </div>
                            </main>
                        )}

                        {!quizResult && (
                            <footer className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center bg-transparent relative z-10">
                                <button
                                    disabled={currentQuestionIdx === 0}
                                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-gray-600 font-black hover:bg-gray-50 hover:text-gray-900 shadow-sm border border-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
                                </button>

                                {isReviewMode ? (
                                    currentQuestionIdx === (activeQuiz.questions?.length || 0) - 1 ? (
                                        <button
                                            onClick={() => { setActiveQuiz(null); setIsReviewMode(false); }}
                                            className="bg-gray-900 text-white px-8 md:px-10 py-3.5 rounded-2xl font-black hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl active:scale-95 hover:-translate-y-1"
                                        >
                                            Close Review
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 md:px-10 py-3.5 rounded-2xl font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 hover:-translate-y-1"
                                        >
                                            Next <ChevronRight size={20} />
                                        </button>
                                    )
                                ) : currentQuestionIdx === (activeQuiz.questions?.length || 0) - 1 ? (
                                    <button
                                        onClick={handleSubmitQuiz}
                                        disabled={isSubmitting || !studentAnswers[activeQuiz.questions[currentQuestionIdx]?.id]}
                                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 md:px-10 py-3.5 rounded-2xl font-black hover:from-emerald-600 hover:to-green-700 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-1"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'} <CheckCircle2 size={20} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                        disabled={!studentAnswers[activeQuiz.questions[currentQuestionIdx]?.id]}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 md:px-10 py-3.5 rounded-2xl font-black hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-1"
                                    >
                                        Next <ChevronRight size={20} />
                                    </button>
                                )}
                            </footer>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const WrappedAssessmentsPage = () => (
    <ErrorBoundary>
        <AssessmentsPage />
    </ErrorBoundary>
);

export default WrappedAssessmentsPage;