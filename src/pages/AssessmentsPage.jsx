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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 overflow-y-auto">
                    
                    {/* Top Bar for Quiz */}
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-slate-900/80 to-transparent">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm text-white">
                                 <BookOpen size={20} />
                             </div>
                             <div>
                                 <h2 className="text-white font-bold text-lg leading-tight tracking-wide">{activeQuiz.title}</h2>
                                 {isReviewMode && <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/30">Review Mode</span>}
                             </div>
                         </div>
                         <button
                             onClick={() => setActiveQuiz(null)}
                             className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all shadow-sm"
                         >
                             <X size={20} />
                         </button>
                    </div>

                    <div className="w-full max-w-4xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col mt-12 relative max-h-[85vh]">
                        {/* Progress Header */}
                        <header className="bg-gray-50 border-b border-gray-100 px-6 py-5 md:px-10 flex flex-col gap-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Question {currentQuestionIdx + 1} of {activeQuiz.questions?.length}</p>
                                    <p className="text-xl font-black text-gray-800">
                                        {Math.round(quizProgress)}% <span className="text-gray-400 font-bold text-base">Completed</span>
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {isReviewMode && activeQuiz.score !== undefined && (
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <Trophy size={18} />
                                            <span>Score: {activeQuiz.score}</span>
                                        </div>
                                    )}
                                    {timeLeft !== null && !quizResult && !isReviewMode && (
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black shadow-sm transition-all duration-300 border ${timeLeft <= 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-gray-700 border-gray-200'}`}>
                                            <Clock size={18} className={timeLeft <= 60 ? 'text-red-500' : 'text-blue-500'} />
                                            <span className="tracking-widest">
                                                {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:
                                                {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
                                                {(timeLeft % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ease-out rounded-full ${isReviewMode ? 'bg-blue-500' : 'bg-blue-600'}`}
                                    style={{ width: `${quizProgress}%` }}
                                ></div>
                            </div>
                        </header>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {!quizResult ? (
                                <main className="p-6 md:p-10 flex flex-col">
                                    {activeQuiz.questions?.[currentQuestionIdx] && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            
                                            {/* Question Block */}
                                            <div className="mb-8">
                                                <div className="inline-block px-3 py-1 mb-4 bg-gray-100 text-gray-500 font-bold text-xs uppercase tracking-widest rounded-lg border border-gray-200">
                                                    {activeQuiz.questions[currentQuestionIdx].marks} Points
                                                </div>
                                                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-snug">
                                                    {activeQuiz.questions[currentQuestionIdx].question}
                                                </h3>
                                            </div>

                                            {/* Options Grid */}
                                            <div className="grid grid-cols-1 gap-3">
                                                {activeQuiz.questions[currentQuestionIdx].type === 'dropdown' ? (
                                                    <div className="w-full max-w-xl relative">
                                                        {(() => {
                                                            const qId = activeQuiz.questions[currentQuestionIdx].id;
                                                            const selectedOptId = studentAnswers[qId];
                                                            const selectedOpt = activeQuiz.questions[currentQuestionIdx].options?.find(o => o.id === selectedOptId);
                                                            const isWrong = isReviewMode && selectedOpt && !selectedOpt.correct;
                                                            const isCorrect = isReviewMode && selectedOpt && selectedOpt.correct;
                                                            
                                                            let borderClass = "border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-50 text-gray-700 bg-white";
                                                            if (isReviewMode) {
                                                                if (isWrong) borderClass = "border-red-400 bg-red-50 text-red-900";
                                                                else if (isCorrect) borderClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                                                            }

                                                            return (
                                                                <>
                                                                    <select
                                                                        disabled={isReviewMode}
                                                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all text-lg font-bold shadow-sm appearance-none cursor-pointer disabled:opacity-90 ${borderClass}`}
                                                                        value={selectedOptId || ""}
                                                                        onChange={(e) => handleAnswerSelect(qId, parseInt(e.target.value), 'dropdown')}
                                                                    >
                                                                        <option value="" disabled>Select your answer...</option>
                                                                        {activeQuiz.questions[currentQuestionIdx].options?.map((opt) => {
                                                                            const isThisSelectedWrong = isReviewMode && !opt.correct && selectedOptId === opt.id;
                                                                            return (
                                                                                <option key={opt.id} value={opt.id}>
                                                                                    {opt.answer} 
                                                                                    {isReviewMode && opt.correct ? ' (✓ Correct)' : ''}
                                                                                    {isThisSelectedWrong ? ' (✗ Incorrect)' : ''}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                    
                                                                    {isWrong && (
                                                                        <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-red-500 bg-red-100 p-2 rounded-full shadow-sm hidden md:flex">
                                                                            <X size={24} strokeWidth={3} />
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    activeQuiz.questions[currentQuestionIdx].options?.map((opt, optIndex) => {
                                                        const qId = activeQuiz.questions[currentQuestionIdx].id;
                                                        const qType = activeQuiz.questions[currentQuestionIdx].type;
                                                        const isSelected = qType === 'multiple'
                                                            ? (studentAnswers[qId] || []).includes(opt.id)
                                                            : studentAnswers[qId] === opt.id;

                                                        const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...

                                                        let borderClass = 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/30';
                                                        let textClass = 'text-gray-700';
                                                        let indicatorClass = 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600';

                                                        if (isReviewMode) {
                                                            if (opt.correct) {
                                                                borderClass = 'border-emerald-500 bg-emerald-50 z-10';
                                                                textClass = 'text-emerald-900 font-bold';
                                                                indicatorClass = 'bg-emerald-500 text-white';
                                                            } else if (isSelected && !opt.correct) {
                                                                borderClass = 'border-red-300 bg-red-50';
                                                                textClass = 'text-red-700 line-through opacity-70';
                                                                indicatorClass = 'bg-red-400 text-white';
                                                            } else {
                                                                borderClass = 'border-gray-100 bg-gray-50/50 opacity-50';
                                                                textClass = 'text-gray-400';
                                                                indicatorClass = 'bg-gray-200 text-gray-400';
                                                            }
                                                        } else if (isSelected) {
                                                            borderClass = 'border-blue-600 bg-blue-50 ring-2 ring-blue-100 shadow-sm z-10';
                                                            textClass = 'text-blue-900 font-bold';
                                                            indicatorClass = 'bg-blue-600 text-white shadow-sm';
                                                        }

                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                disabled={isReviewMode}
                                                                onClick={() => handleAnswerSelect(qId, opt.id, qType)}
                                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group ${borderClass} ${isReviewMode ? 'cursor-default' : 'active:scale-[0.99]'}`}
                                                            >
                                                                <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-sm transition-colors flex-shrink-0 ${indicatorClass}`}>
                                                                    {letter}
                                                                </div>
                                                                <span className={`text-[1.1rem] leading-snug flex-1 ${textClass}`}>
                                                                    {opt.answer}
                                                                </span>
                                                                {isReviewMode && opt.correct && (
                                                                     <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded tracking-widest hidden md:block">
                                                                         Correct Answer
                                                                     </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </main>
                            ) : (
                                <main className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 animate-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50">
                                        <Trophy size={48} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Quiz Completed!</h2>
                                    <p className="text-gray-500 mb-8 max-w-sm">
                                        Awesome job! Your results have been securely saved.
                                    </p>
                                    
                                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl w-full max-w-xs relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Final Score</p>
                                        <div className="text-6xl font-black text-blue-600 mb-2">
                                            {quizResult.score} <span className="text-lg text-gray-400 font-bold">Marks</span>
                                        </div>
                                    </div>
                                </main>
                            )}
                        </div>

                        {/* Footer Controls */}
                        {!quizResult && (
                            <footer className="border-t border-gray-100 bg-gray-50 px-6 py-4 md:px-10 flex justify-between items-center z-20">
                                <button
                                    disabled={currentQuestionIdx === 0}
                                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={18} /> <span className="hidden sm:inline">Previous</span>
                                </button>

                                {isReviewMode ? (
                                    currentQuestionIdx === (activeQuiz.questions?.length || 0) - 1 ? (
                                        <button
                                            onClick={() => { setActiveQuiz(null); setIsReviewMode(false); }}
                                            className="bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-900 transition-all shadow-md active:scale-95"
                                        >
                                            Close Review
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                        >
                                            Next <ChevronRight size={18} />
                                        </button>
                                    )
                                ) : currentQuestionIdx === (activeQuiz.questions?.length || 0) - 1 ? (
                                    <button
                                        onClick={handleSubmitQuiz}
                                        disabled={isSubmitting || !studentAnswers[activeQuiz.questions[currentQuestionIdx]?.id]}
                                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'} <CheckCircle2 size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                        disabled={!studentAnswers[activeQuiz.questions[currentQuestionIdx]?.id]}
                                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                                    >
                                        Next <ChevronRight size={18} />
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