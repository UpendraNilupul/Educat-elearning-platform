import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, BookOpen, Clock, ChevronRight, 
    ChevronLeft, X, CheckCircle2, Trophy, AlertCircle
} from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Using your configured Axios instance!

const AssessmentsPage = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Quiz Player State
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [studentAnswers, setStudentAnswers] = useState({}); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

    const userId = localStorage.getItem('userId');

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

    const handleStartQuiz = async (quiz) => {
        try {
            // 🌟 THE FIX: Switched to api.get
            const resp = await api.get(`/quizzes/${quiz.id}`);
            setActiveQuiz(resp.data);
            setCurrentQuestionIdx(0);
            setStudentAnswers({});
            setQuizResult(null);
        } catch (err) {
            alert("Failed to load quiz questions.");
        }
    };

    const handleAnswerSelect = (qId, aId) => {
        setStudentAnswers(prev => ({
            ...prev,
            [qId]: aId
        }));
    };

    const handleSubmitQuiz = async () => {
        if (!activeQuiz) return;
        
        setIsSubmitting(true);
        try {
            const answersArray = Object.entries(studentAnswers).map(([qId, aId]) => ({
                qId: parseInt(qId),
                aId: parseInt(aId)
            }));

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.filter(a => {
                    const matchesTab = a.status === activeTab;
                    const isPublished = !a.publish_at || new Date(a.publish_at) <= new Date();
                    return matchesTab && isPublished;
                }).map((item) => (
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
                            <button 
                                onClick={() => item.type === 'Quiz' ? handleStartQuiz(item) : alert("Please upload assignment from the specific course lesson page.")}
                                className="w-full bg-purple-600 text-white py-2.5 rounded-xl mt-6 font-bold hover:bg-purple-700 transition shadow-sm"
                            >
                                {item.type === 'Quiz' ? 'Start Quiz' : 'Submit Assignment'}
                            </button>
                        ) : (
                            <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl mt-6 font-bold cursor-not-allowed">
                                <CheckCircle2 size={18} className="inline mr-2" /> Done
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Quiz Player Overlay */}
            {activeQuiz && (
                <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center p-8 animate-in slide-in-from-bottom duration-300">
                    <button 
                        onClick={() => setActiveQuiz(null)}
                        className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"
                    >
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-3xl flex flex-col h-full">
                        <header className="mb-12">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <BookOpen className="text-purple-600" /> {activeQuiz.title}
                            </h2>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                                <div 
                                    className="bg-purple-600 h-full transition-all duration-300" 
                                    style={{ width: `${quizProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs font-bold text-gray-400">
                                <span>Question {currentQuestionIdx + 1} of {activeQuiz.questions?.length}</span>
                                <span>{Math.round(quizProgress)}% Complete</span>
                            </div>
                        </header>

                        {!quizResult ? (
                            <main className="flex-1">
                                {activeQuiz.questions?.[currentQuestionIdx] && (
                                    <div className="animate-in fade-in slide-in-from-right duration-500">
                                        <div className="mb-8">
                                            <span className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-2 block">
                                                Question #{currentQuestionIdx + 1} ({activeQuiz.questions[currentQuestionIdx].marks} Marks)
                                            </span>
                                            <h3 className="text-3xl font-bold text-gray-800 leading-tight">
                                                {activeQuiz.questions[currentQuestionIdx].question}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {activeQuiz.questions[currentQuestionIdx].options?.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleAnswerSelect(activeQuiz.questions[currentQuestionIdx].id, opt.id)}
                                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                                        studentAnswers[activeQuiz.questions[currentQuestionIdx].id] === opt.id 
                                                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-100' 
                                                        : 'border-gray-200 hover:border-purple-200'
                                                    }`}
                                                >
                                                    <span className={`text-lg font-semibold ${studentAnswers[activeQuiz.questions[currentQuestionIdx].id] === opt.id ? 'text-purple-700' : 'text-gray-700'}`}>
                                                        {opt.answer}
                                                    </span>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        studentAnswers[activeQuiz.questions[currentQuestionIdx].id] === opt.id 
                                                        ? 'border-purple-600 bg-purple-600' 
                                                        : 'border-gray-300 group-hover:border-purple-300'
                                                    }`}>
                                                        {studentAnswers[activeQuiz.questions[currentQuestionIdx].id] === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </main>
                        ) : (
                            <main className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                    <Trophy size={48} />
                                </div>
                                <h2 className="text-4xl font-black text-gray-900 mb-2">Quiz Completed!</h2>
                                <p className="text-gray-500 mb-8 max-w-sm">
                                    You've successfully submitted the quiz. Your results are calculated instantly.
                                </p>
                                
                                <div className="bg-white border-2 border-gray-100 rounded-3xl p-10 shadow-xl mb-12 w-full max-w-sm">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Your Final Score</p>
                                    <div className="text-7xl font-black text-purple-600">
                                        {quizResult.score} <span className="text-2xl text-gray-300">Marks</span>
                                    </div>
                                    <div className="mt-8 flex items-center justify-center gap-3 text-green-600 font-bold bg-green-50 py-3 rounded-2xl">
                                        <CheckCircle2 size={20} /> Successful Attempt
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setActiveQuiz(null)}
                                    className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    Finish & Exit
                                </button>
                            </main>
                        )}

                        {!quizResult && (
                            <footer className="mt-auto py-8 border-t flex justify-between items-center bg-white sticky bottom-0">
                                <button 
                                    disabled={currentQuestionIdx === 0}
                                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                                    className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-700 disabled:opacity-30"
                                >
                                    <ChevronLeft /> Previous
                                </button>

                                {currentQuestionIdx === (activeQuiz.questions?.length || 0) - 1 ? (
                                    <button 
                                        onClick={handleSubmitQuiz}
                                        disabled={isSubmitting || !studentAnswers[activeQuiz.questions[currentQuestionIdx]?.id]}
                                        className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-green-700 transition shadow-lg flex items-center gap-2 disabled:bg-gray-300"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                        disabled={!studentAnswers[activeQuiz.questions[currentQuestionIdx]?.id]}
                                        className="bg-purple-600 text-white px-10 py-3 rounded-2xl font-black hover:bg-purple-700 transition shadow-lg flex items-center gap-2 disabled:bg-gray-300"
                                    >
                                        Next Question <ChevronRight />
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

export default AssessmentsPage;