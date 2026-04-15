import React, { useState, useEffect } from 'react';
import { 
    PlayCircle, 
    Video, 
    FileText, 
    Download, 
    Lock, 
    Clock, 
    ChevronDown, 
    ChevronUp,
    Calendar,
    CreditCard,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Sparkles,
    ClipboardList
} from 'lucide-react';
import api from '../api'; // 🌟 THE FIX: Import your Axios instance

const TuitionClass = () => {
    // View state
    const [selectedClassId, setSelectedClassId] = useState(null); 
    const [checkoutClass, setCheckoutClass] = useState(null);     
    
    // Gatekeeper state for the "Make a payment" dropdown
    const [expandedPaymentClassId, setExpandedPaymentClassId] = useState(null);

    const [activeMonth, setActiveMonth] = useState(null);
    const [activeVideo, setActiveVideo] = useState(1);
    const [activeTab, setActiveTab] = useState('Recordings');

    // Database state
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);

    // 🌟 MOCK DATA FOR SUGGESTED CLASSES
    const mockSuggestedClasses = [
        {
            id: 'sug-1',
            subject: 'Advanced React Patterns',
            grade: 'Professional',
            monthlyFee: 3500,
            teacher: { name: 'Kasun Perera', image: 'https://ui-avatars.com/api/?name=Kasun+Perera&background=random&color=fff' },
            months: [{ id: 'm-sug-1', name: 'April', isPaid: false }]
        },
        {
            id: 'sug-2',
            subject: 'Laravel API Masterclass',
            grade: 'Professional',
            monthlyFee: 4000,
            teacher: { name: 'Nuwan Bandara', image: 'https://ui-avatars.com/api/?name=Nuwan+Bandara&background=random&color=fff' },
            months: [{ id: 'm-sug-2', name: 'April', isPaid: false }]
        },
        {
            id: 'sug-3',
            subject: 'Network Security Basics',
            grade: 'Advanced',
            monthlyFee: 2500,
            teacher: { name: 'Dr. Silva', image: 'https://ui-avatars.com/api/?name=Dr+Silva&background=random&color=fff' },
            months: [{ id: 'm-sug-3', name: 'April', isPaid: false }]
        }
    ];

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const userId = localStorage.getItem('userId');
                // 🌟 THE FIX: Use api.get() and response.data
                const response = await api.get(`/student/classes?userId=${userId}`);
                setEnrolledClasses(response.data);
            } catch (error) {
                console.error("Error fetching classes:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClasses();
    }, []);

    // 🌟 GATEKEEPER LOGIC
    const handleEnterPortal = (cls) => {
        const currentMonth = cls.months[0]; 
        
        if (currentMonth && currentMonth.isPaid) {
            setSelectedClassId(cls.id);
            setActiveMonth(currentMonth.id);
            if (currentMonth.videos?.length > 0) {
                setActiveVideo(currentMonth.videos[0].id);
            }
        } else {
            if (expandedPaymentClassId === cls.id) {
                setExpandedPaymentClassId(null);
            } else {
                setExpandedPaymentClassId(cls.id);
            }
        }
    };

    const handlePayment = async (classId, moduleId, amount) => {
        setIsProcessing(true);
        try {
            const userId = localStorage.getItem('userId');
            // 🌟 THE FIX: Use api.post()
            await api.post('/student/pay', { userId, classId, moduleId, amount });

            alert("Payment Successful! Your class is now unlocked.");
            window.location.reload(); 
        } catch (error) {
            console.error("Payment error:", error);
            alert(error.response?.data?.message || "Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();
        if (!submissionFile || !activeAssignment) return;
        
        setIsProcessing(true);
        try {
            const userId = localStorage.getItem('userId');
            const formData = new FormData();
            formData.append('submission', submissionFile);
            formData.append('userId', userId);
            formData.append('type', 'submission');

            // 🌟 THE FIX: Use api.post() and pass formData directly. Axios sets the multipart headers automatically!
            await api.post(`/assignments/${activeAssignment.id}/submit`, formData);

            alert("Assignment submitted successfully!");
            setIsSubmissionModalOpen(false);
            setSubmissionFile(null);
            window.location.reload(); // Refresh to show submission status
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Submission failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[600px] items-center justify-center">
                <div className="text-xl font-bold text-brand-purple animate-pulse">Loading lessons...</div>
            </div>
        );
    }

    // Filter classes into Paid and Unpaid
    const paidClasses = enrolledClasses.filter(cls => cls.months[0]?.isPaid);
    const unpaidClasses = enrolledClasses.filter(cls => !cls.months[0]?.isPaid);
    
    const currentClass = enrolledClasses.find(c => c.id === selectedClassId);
    const currentMonthData = currentClass?.months.find(m => m.id === activeMonth) || currentClass?.months[0];

    // ==========================================
    // VIEW 1: MAIN GRID
    // ==========================================
    if (!selectedClassId && !checkoutClass) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">My Lessons</h1>
                    <p className="text-gray-500 mt-2 font-medium">Access your class portals, discover new topics, and manage payments.</p>
                </div>

                {/* SECTION 1: PAID CLASSES */}
                {paidClasses.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-gray-900">Paid Classes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paidClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden relative">
                                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Unlocked</div>
                                    <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-emerald-50/30 to-white">
                                        <img src={cls.teacher.image} alt={cls.teacher.name} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                            <p className="text-xs font-semibold text-gray-500 mt-1">{cls.grade}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-black text-gray-900">{cls.subject}</h2>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">
                                                {cls.months[0]?.name}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleEnterPortal(cls)}
                                            className="w-full mt-auto py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md"
                                        >
                                            Enter Portal
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION 2: SUGGESTED CLASSES */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-6 h-6 text-orange-500" />
                        <h2 className="text-xl font-bold text-gray-900">Suggested Classes for You</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockSuggestedClasses.map((cls) => (
                            <div key={cls.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden relative group">
                                <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">New</div>
                                <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-orange-50/50 to-white">
                                    <img src={cls.teacher.image} alt={cls.teacher.name} className="w-16 h-16 rounded-xl shadow-sm object-cover" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                        <p className="text-xs font-semibold text-gray-500 mt-1">{cls.grade}</p>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{cls.subject}</h2>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleEnterPortal(cls)}
                                        className={`w-full mt-auto py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                                            expandedPaymentClassId === cls.id 
                                                ? 'bg-gray-100 text-gray-500' 
                                                : 'bg-gray-900 text-white hover:bg-orange-600'
                                        }`}
                                    >
                                        Enter Portal
                                    </button>

                                    {expandedPaymentClassId === cls.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 mb-3 text-red-500 bg-red-50 p-2 rounded-lg">
                                                <Lock className="w-4 h-4" />
                                                <p className="text-[11px] font-bold">Enroll and pay to unlock this class.</p>
                                            </div>
                                            <button 
                                                onClick={() => setCheckoutClass(cls)}
                                                className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-md"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Enroll Now (Rs. {cls.monthlyFee})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 3: THIS MONTH CLASSES (PENDING PAYMENT) */}
                {unpaidClasses.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-6 h-6 text-brand-purple" />
                            <h2 className="text-xl font-bold text-gray-900">Pending Month Renewals</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {unpaidClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
                                        <img src={cls.teacher.image} alt={cls.teacher.name} className="w-16 h-16 rounded-xl shadow-sm object-cover grayscale opacity-80" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                            <p className="text-xs font-semibold text-gray-500 mt-1">{cls.grade}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-black text-gray-900">{cls.subject}</h2>
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase tracking-wider">
                                                {cls.months[0]?.name} Locked
                                            </span>
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleEnterPortal(cls)}
                                            className={`w-full mt-auto py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                                                expandedPaymentClassId === cls.id 
                                                    ? 'bg-gray-100 text-gray-500' 
                                                    : 'bg-gray-900 text-white hover:bg-brand-purple'
                                            }`}
                                        >
                                            Enter Portal
                                        </button>

                                        {expandedPaymentClassId === cls.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-3 text-red-500 bg-red-50 p-2 rounded-lg">
                                                    <Lock className="w-4 h-4" />
                                                    <p className="text-xs font-bold">Please pay to unlock this month.</p>
                                                </div>
                                                <button 
                                                    onClick={() => setCheckoutClass(cls)}
                                                    className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-md"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Make a Payment (Rs. {cls.monthlyFee})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // VIEW 2: THE "MAKE A PAYMENT" SCREEN
    // ==========================================
    if (checkoutClass) {
        const currentMonth = checkoutClass.months[0];
        return (
            <div className="p-8 max-w-[800px] mx-auto animate-in slide-in-from-bottom-4 duration-300">
                <button 
                    onClick={() => {
                        setCheckoutClass(null);
                        setExpandedPaymentClassId(null); 
                    }}
                    className="group mb-8 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-300 w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> 
                    Back to Lessons
                </button>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden text-center">
                    <div className="bg-gray-50 py-12 px-6 border-b border-gray-100 flex flex-col items-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <Lock className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Class Portal Locked</h2>
                        <p className="text-gray-500 text-lg max-w-md">
                            You need to pay the class fees for <span className="font-bold text-gray-900">{currentMonth?.name}</span> to enter the portal.
                        </p>
                    </div>

                    <div className="p-10 flex flex-col items-center">
                        <div className="w-full max-w-sm bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex justify-between items-center">
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900">{checkoutClass.subject}</h3>
                                <p className="text-sm text-gray-500">{checkoutClass.teacher.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase">Amount</p>
                                <p className="text-2xl font-black text-brand-purple">Rs. {checkoutClass.monthlyFee}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handlePayment(checkoutClass.id, currentMonth.id, checkoutClass.monthlyFee)}
                            disabled={isProcessing}
                            className="w-full max-w-sm py-4 bg-purple-600 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1"
                        >
                            <CreditCard className="w-5 h-5" />
                            {isProcessing ? "Processing Payment..." : "Make a Payment"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW 3: INSIDE THE CLASS PORTAL
    // ==========================================
    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4 duration-300">
            <button 
                onClick={() => setSelectedClassId(null)}
                className="group mb-8 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-300 w-fit"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> 
                Back to Lessons
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <img src={currentClass.teacher.image} alt={currentClass.teacher.name} className="w-20 h-20 rounded-xl shadow-md object-cover" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="w-3 h-3"/> Active Portal
                            </span>
                            <span className="text-xs font-bold text-brand-purple bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {currentClass.grade}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{currentClass.subject}</h1>
                        <p className="text-gray-500 font-medium">By {currentClass.teacher.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                        {['Recordings', 'Live Class', 'Assignments', 'Tutes'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab ? 'bg-purple-50 text-brand-purple' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {tab === 'Recordings' && <PlayCircle className="w-4 h-4" />}
                                {tab === 'Live Class' && <Video className="w-4 h-4" />}
                                {tab === 'Assignments' && <ClipboardList className="w-4 h-4" />}
                                {tab === 'Tutes' && <FileText className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                        {activeTab === 'Recordings' && currentMonthData && (
                            <div className="flex flex-col h-full">
                                {currentMonthData.isPaid ? (
                                    <>
                                        <div className="bg-gray-900 w-full h-64 md:h-80 relative group flex items-center justify-center rounded-b-2xl border-b-4 border-gray-800">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-transparent opacity-50 rounded-b-2xl"></div>
                                            <button 
                                                onClick={() => {
                                                    const video = currentMonthData.videos?.find(v => v.id === activeVideo);
                                                    if (video && video.link) window.open(video.link, '_blank');
                                                }}
                                                className="relative z-10 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-brand-purple transition-all hover:scale-110 shadow-[0_0_30px_rgba(126,34,206,0.3)]"
                                            >
                                                <PlayCircle className="w-10 h-10 ml-1" />
                                            </button>
                                        </div>
                                        <div className="p-8">
                                            <h2 className="text-2xl font-black text-gray-900 mb-2">
                                                {currentMonthData.videos?.find(v => v.id === activeVideo)?.title || 'Select a video'}
                                            </h2>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                                        <Lock className="w-10 h-10 text-red-500 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900">Previous Month Locked</h3>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Live Class' && (
                            <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                                <Video className="w-16 h-16 text-blue-600 mb-6" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Live Class</h2>
                                <a href={currentClass.zoomLink} target="_blank" rel="noreferrer" className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-md mt-4 hover:bg-blue-700 transition-colors">
                                    Open Zoom Link
                                    </a>
                                </div>
                        )}

                        {activeTab === 'Assignments' && (
                            <div className="p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Assignments</h2>
                                {(currentMonthData?.assignments || []).length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No assignments for this module.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {currentMonthData.assignments.map(assign => (
                                            <div key={assign.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-purple-200 transition-all flex flex-col">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-lg font-bold text-gray-900">{assign.title}</h3>
                                                    {assign.submission ? (
                                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase flex items-center gap-1">
                                                            <CheckCircle size={10} /> {assign.submission.status}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase flex items-center gap-1">
                                                            <Clock size={10} /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{assign.description}</p>
                                                
                                                <div className="mt-auto space-y-4">
                                                    <div className="flex justify-between text-[11px] font-bold text-gray-400">
                                                        <span>Due: {new Date(assign.deadline).toLocaleDateString()}</span>
                                                        <span>{assign.maxMarks} Marks</span>
                                                    </div>
                                                    
                                                    {assign.submission?.status === 'graded' ? (
                                                        <div className="bg-purple-100 p-4 rounded-xl border border-purple-200">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-purple-700">Grade</span>
                                                                <span className="text-lg font-black text-purple-900">{assign.submission.grade}/{assign.maxMarks}</span>
                                                            </div>
                                                            <p className="text-[11px] text-purple-600 italic">"{assign.submission.feedback}"</p>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => { setActiveAssignment(assign); setIsSubmissionModalOpen(true); }}
                                                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                                assign.submission ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-brand-purple text-white hover:bg-purple-700 shadow-md'
                                                            }`}
                                                        >
                                                            {assign.submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Tutes' && currentMonthData && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Class Tutes</h2>
                                {currentMonthData.isPaid ? (
                                    <div className="space-y-3">
                                        {currentMonthData.tutes?.map(tute => (
                                            <div key={tute.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-purple-100 text-brand-purple rounded-xl"><FileText className="w-6 h-6" /></div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-brand-purple">{tute.name}</h4>
                                                </div>
                                                <button className="p-2.5 text-brand-purple bg-purple-100 hover:bg-brand-purple hover:text-white transition-all rounded-lg"><Download className="w-5 h-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-red-50 border border-red-100 rounded-xl flex items-center gap-4">
                                        <AlertCircle className="w-6 h-6 text-red-500" />
                                        <h4 className="font-bold text-red-900">Tutes Locked</h4>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Monthly Index */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)] sticky top-6">
                        <div className="p-5 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-lg text-gray-900">Class Content</h3></div>
                        <div className="overflow-y-auto flex-1 p-3 space-y-2">
                            {currentClass.months.map((month) => (
                                <div key={month.id} className="rounded-xl border border-gray-100 overflow-hidden">
                                    <button onClick={() => setActiveMonth(month.id)} className={`w-full flex justify-between p-4 ${activeMonth === month.id ? 'bg-purple-50' : 'bg-white hover:bg-gray-50 transition-colors'}`}>
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-bold ${activeMonth === month.id ? 'text-brand-purple' : 'text-gray-900'}`}>{month.name}</h4>
                                            {!month.isPaid && <Lock className="w-3 h-3 text-red-400" />}
                                        </div>
                                        {activeMonth === month.id ? <ChevronUp className="w-5 h-5 text-brand-purple" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </button>
                                    {activeMonth === month.id && (
                                        <div className="bg-white py-2 border-t border-gray-50">
                                            {month.videos?.map((video) => (
                                                <button key={video.id} onClick={() => { setActiveVideo(video.id); setActiveTab('Recordings'); }} disabled={!month.isPaid} className={`w-full flex gap-3 p-3 pl-5 text-left transition-colors ${!month.isPaid ? 'opacity-50' : 'hover:bg-gray-50'} ${activeVideo === video.id && activeTab === 'Recordings' ? 'bg-purple-50/50 border-l-4 border-brand-purple' : 'border-l-4 border-transparent'}`}>
                                                    <PlayCircle className={`w-4 h-4 mt-0.5 ${activeVideo === video.id && activeTab === 'Recordings' ? 'text-brand-purple' : 'text-gray-400'}`} />
                                                    <p className={`text-sm font-semibold ${activeVideo === video.id && activeTab === 'Recordings' ? 'text-brand-purple' : 'text-gray-700'}`}>{video.title}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submission Modal */}
            {isSubmissionModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300">
                        <button onClick={() => setIsSubmissionModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Submit Assignment</h2>
                        <p className="text-gray-500 mb-6 text-sm font-medium">{activeAssignment?.title}</p>
                        
                        <form onSubmit={handleAssignmentSubmit} className="space-y-6">
                            <div className="border-2 border-dashed border-purple-100 rounded-2xl p-10 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors cursor-pointer group relative">
                                <input 
                                    type="file" 
                                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    required
                                />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-brand-purple group-hover:scale-110 transition-transform">
                                        <Download size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">{submissionFile ? submissionFile.name : "Choose or drag file"}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">PDF, DOCX or ZIP preferred</p>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isProcessing}
                                className="w-full py-4 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? "Uploading..." : "Click to Submit"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TuitionClass;