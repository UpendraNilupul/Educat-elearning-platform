import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PlayCircle,
    Lock,
    Calendar,
    CreditCard,
    CheckCircle,
    ArrowLeft,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    FileText,
    ClipboardList,
    BookOpen,
    Link as LinkIcon,
    X,
    Star,
    MessageSquare,
    Clock,
    AlertCircle,
    Megaphone
} from 'lucide-react';
import api from '../api';
import axios from 'axios';

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const getResourceDownloadUrl = (resource) => {
    if (resource.link && resource.link.includes('res.cloudinary.com') && resource.link.includes('/raw/upload/')) {
        return `http://localhost:3000/api/resources/download?url=${encodeURIComponent(resource.link)}&name=${encodeURIComponent(resource.name)}`;
    }
    return resource.link;
};

const feedbackQuestions = [
    { id: 'q1', text: "1. How clear was the teacher's explanation during the class?", options: ['Very Clear', 'Clear', 'Average', 'Not Clear'] },
    { id: 'q2', text: "2. How engaging was the lesson?", options: ['Very Engaging', 'Engaging', 'Somewhat Engaging', 'Not Engaging'] },
    { id: 'q3', text: "3. Did the teacher answer students' questions effectively?", options: ['Always', 'Most of the Time', 'Sometimes', 'Rarely'] },
    { id: 'q4', text: "4. How useful were the class materials?", options: ['Very Useful', 'Useful', 'Average', 'Not Useful'] },
    { id: 'q5', text: "5. Would you recommend this class to other students?", options: ['Definitely', 'Probably', 'Maybe', 'No'] },
    { id: 'q6', text: "6. How difficult was today's lesson?", options: ['Very Easy', 'Easy', 'Moderate', 'Difficult'] },
    { id: 'q7', text: "7. How satisfied are you with the class overall?", options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'] },
    { id: 'q8', text: "8. Was the class conducted on time?", options: ['Always', 'Usually', 'Sometimes', 'Never'] },
    { id: 'q9', text: "9. How confident do you feel about the topic after this class?", options: ['Very Confident', 'Confident', 'Somewhat Confident', 'Not Confident'] },
    { id: 'q10', text: "10. Which aspect of the class was the best?", options: ['Teacher Explanation', 'Class Activities', 'Assignments/Quizzes', 'Study Materials'] }
];

const TuitionClass = () => {
    const navigate = useNavigate();
    // View state
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [checkoutClass, setCheckoutClass] = useState(null);
    const [playingVideoUrl, setPlayingVideoUrl] = useState(null);

    // Gatekeeper state for the "Make a payment" dropdown
    const [expandedPaymentClassId, setExpandedPaymentClassId] = useState(null);

    // Slip Upload States
    const [paymentMode, setPaymentMode] = useState('select'); // 'select', 'card', 'slip'
    const [slipFile, setSlipFile] = useState(null);
    const [isUploadingSlip, setIsUploadingSlip] = useState(false);

    const [activeMonth, setActiveMonth] = useState(null);
    const [expandedLessons, setExpandedLessons] = useState([]);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ rating: 5, title: '', description: '', survey_responses: {} });
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleLesson = (lessonId) => {
        setExpandedLessons(prev =>
            prev.includes(lessonId)
                ? prev.filter(id => id !== lessonId)
                : [...prev, lessonId]
        );
    };

    // Database state
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestedClasses, setSuggestedClasses] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const response = await api.get(`/student/classes?userId=${userId}`);
                setEnrolledClasses(response.data);

                const suggestedRes = await api.get('/suggested-classes');
                setSuggestedClasses(suggestedRes.data);
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
            const order_id = `${classId}_${moduleId || 'm'}_${userId}_${Date.now()}`;

            // 1. Get Hash from Backend
            const hashRes = await api.post('/payment/generate-hash', {
                order_id: order_id,
                amount: amount,
                currency: 'LKR'
            });

            const hash = hashRes.data.hash;

            // 2. Setup PayHere object
            const payment = {
                sandbox: true,
                merchant_id: '1234834',
                return_url: window.location.href,
                cancel_url: window.location.href,
                notify_url: 'https://webhook.site/placeholder',
                order_id: order_id,
                items: 'Educat Class Fee',
                amount: amount,
                currency: 'LKR',
                hash: hash,
                first_name: 'Student',
                last_name: '',
                email: 'student@educat.lk',
                phone: '0770000000',
                address: 'Sri Lanka',
                city: 'Colombo',
                country: 'Sri Lanka',
            };

            // 3. Define Callbacks
            window.payhere.onCompleted = function onCompleted(orderId) {
                console.log("Payment completed. OrderID:" + orderId);
                api.post('/payment/manual-success', {
                    order_id: orderId,
                    amount: amount,
                    classId: classId,
                    userId: userId
                }).then(() => {
                    alert("Payment Successful! Your class is now unlocked.");
                    window.location.reload();
                }).catch(err => {
                    console.error("Manual success failed", err);
                    window.location.reload();
                });
            };

            window.payhere.onDismissed = function onDismissed() {
                console.log("Payment dismissed");
                setIsProcessing(false);
            };

            window.payhere.onError = function onError(error) {
                console.log("Error:" + error);
                alert("Payment Error: " + error);
                setIsProcessing(false);
            };

            // 4. Start Payment
            window.payhere.startPayment(payment);

        } catch (error) {
            console.error("Payment error:", error);
            alert("Could not initialize payment. Please try again.");
            setIsProcessing(false);
        }
    };

    const handleSlipUpload = async (classId, amount) => {
        if (!slipFile) {
            alert("Please select a slip image to upload.");
            return;
        }
        setIsUploadingSlip(true);
        try {
            const formData = new FormData();
            formData.append('slip_image', slipFile);
            formData.append('classId', classId);
            formData.append('userId', localStorage.getItem('userId'));
            formData.append('amount', amount);

            await api.post('/payment/slip-upload', formData);
            alert("Bank slip uploaded successfully! It is pending admin approval.");
            setCheckoutClass(null);
            setExpandedPaymentClassId(null);
            setPaymentMode('select');
            setSlipFile(null);
        } catch (error) {
            console.error("Slip upload error:", error);
            alert("Could not upload slip. Please try again.");
        } finally {
            setIsUploadingSlip(false);
        }
    };

    useEffect(() => {
        setHasReviewed(false);
        const checkReviewStatus = async () => {
            try {
                const userId = localStorage.getItem('userId');
                if (!userId) return;
                const response = await api.get(`/reviews/check/${selectedClassId}/${userId}`);
                setHasReviewed(response.data.hasReviewed);
            } catch (error) {
                console.error("Failed to check review status", error);
            }
        };
        if (selectedClassId) {
            checkReviewStatus();
        }
    }, [selectedClassId]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                // Ensure classData.id is available dynamically
                const response = await api.get(`/classes/${selectedClassId}/announcements`);
                setAnnouncements(response.data);
            } catch (error) {
                console.error("Failed to fetch announcements", error);
            }
        };
        
        if (selectedClassId) {
            fetchAnnouncements();
        }
    }, [selectedClassId]);

    if (isLoading) {
        return (
            <div className="flex h-[600px] items-center justify-center">
                <div className="text-xl font-bold text-brand-purple animate-pulse">Loading classes...</div>
            </div>
        );
    }

    // Filter classes into Paid and Unpaid
    const paidClasses = enrolledClasses.filter(cls => cls.months[0]?.isPaid);
    const unpaidClasses = enrolledClasses.filter(cls => !cls.months[0]?.isPaid);

    const currentClass = enrolledClasses.find(c => c.id === selectedClassId);

    // ==========================================
    // VIEW 1: MAIN GRID (Dashboard)
    // ==========================================
    if (!selectedClassId && !checkoutClass) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">My Classes</h1>
                    <p className="mt-2 font-medium text-gray-500">Access your class portals, discover new topics, and manage payments.</p>
                </div>

                {/* SECTION 1: PAID CLASSES */}
                {paidClasses.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-gray-900">Paid Classes</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {paidClasses.map((cls) => (
                                <div key={cls.id} className="relative flex flex-col overflow-hidden transition-all bg-white border-2 shadow-sm rounded-2xl border-emerald-100 hover:shadow-lg">
                                    {cls.status === 'completed' ? (
                                        <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Completed
                                        </div>
                                    ) : (
                                        <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Unlocked</div>
                                    )}
                                    <div className="flex items-center gap-4 p-6 border-b border-gray-50 bg-gradient-to-r from-emerald-50/30 to-white">
                                        <img src={cls.thumbnail || cls.teacher.image} alt={cls.subject} className="object-cover w-16 h-16 shadow-sm rounded-xl animate-in fade-in" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                            <p className="mt-1 text-xs font-semibold text-gray-500">{cls.grade}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-black text-gray-900">{cls.subject}</h2>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">
                                                {cls.months[0]?.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleEnterPortal(cls)}
                                            className="w-full py-3 mt-auto text-sm font-bold text-white transition-all shadow-md bg-emerald-600 rounded-xl hover:bg-emerald-700"
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
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {suggestedClasses.map((cls) => (
                            <div key={cls.id} className="relative flex flex-col overflow-hidden transition-all bg-white border border-orange-100 shadow-sm rounded-2xl hover:shadow-lg group">
                                <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">New</div>
                                <div className="flex items-center gap-4 p-6 border-b border-gray-50 bg-gradient-to-r from-orange-50/50 to-white">
                                    <img src={cls.thumbnail || cls.teacher.image} alt={cls.subject} className="object-cover w-16 h-16 shadow-sm rounded-xl animate-in fade-in" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                        <p className="mt-1 text-xs font-semibold text-gray-500">{cls.grade}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-black text-gray-900 transition-colors group-hover:text-orange-600">{cls.subject}</h2>
                                    </div>

                                    <button
                                        onClick={() => handleEnterPortal(cls)}
                                        className={`w-full mt-auto py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${expandedPaymentClassId === cls.id
                                            ? 'bg-gray-100 text-gray-500'
                                            : 'bg-gray-900 text-white hover:bg-orange-600'
                                            }`}
                                    >
                                        Enter Portal
                                    </button>

                                    {expandedPaymentClassId === cls.id && (
                                        <div className="pt-4 mt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 p-2 mb-3 text-red-500 rounded-lg bg-red-50">
                                                <Lock className="w-4 h-4" />
                                                <p className="text-[11px] font-bold">Enroll and pay to unlock this class.</p>
                                            </div>
                                            <button
                                                onClick={() => setCheckoutClass(cls)}
                                                className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-white transition-all bg-purple-600 shadow-md rounded-xl hover:bg-purple-700"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Enroll Now (LKR {cls.monthlyFee})
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
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {unpaidClasses.map((cls) => (
                                <div key={cls.id} className="flex flex-col overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-lg">
                                    <div className="flex items-center gap-4 p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                                        <img src={cls.thumbnail || cls.teacher.image} alt={cls.subject} className={`object-cover w-16 h-16 shadow-sm rounded-xl ${!cls.thumbnail ? 'grayscale opacity-80' : ''} animate-in fade-in`} />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                            <p className="mt-1 text-xs font-semibold text-gray-500">{cls.grade}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-black text-gray-900">{cls.subject}</h2>
                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded uppercase tracking-wider">
                                                {cls.months[0]?.name} Locked
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleEnterPortal(cls)}
                                            className={`w-full mt-auto py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${expandedPaymentClassId === cls.id
                                                ? 'bg-gray-100 text-gray-500'
                                                : 'bg-gray-900 text-white hover:bg-brand-purple'
                                                }`}
                                        >
                                            Enter Portal
                                        </button>

                                        {expandedPaymentClassId === cls.id && (
                                            <div className="pt-4 mt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 p-2 mb-3 text-red-500 rounded-lg bg-red-50">
                                                    <Lock className="w-4 h-4" />
                                                    <p className="text-xs font-bold">Please pay to unlock this month.</p>
                                                </div>
                                                <button
                                                    onClick={() => setCheckoutClass(cls)}
                                                    className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-white transition-all bg-purple-600 shadow-md rounded-xl hover:bg-purple-700"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Make a Payment (LKR {cls.monthlyFee})
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
                        if (paymentMode !== 'select') {
                            setPaymentMode('select');
                            setSlipFile(null);
                        } else {
                            setCheckoutClass(null);
                            setExpandedPaymentClassId(null);
                        }
                    }}
                    className="group mb-8 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-300 w-fit"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    Back to Lessons
                </button>

                <div className="overflow-hidden text-center bg-white border border-gray-100 shadow-lg rounded-3xl">
                    <div className="flex flex-col items-center px-6 py-12 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-red-50">
                            <Lock className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="mb-2 text-3xl font-black text-gray-900">Class Portal Locked</h2>
                        <p className="max-w-md text-lg text-gray-500">
                            You need to pay the class fees for <span className="font-bold text-gray-900">{currentMonth?.name}</span> to enter the portal.
                        </p>
                    </div>

                    <div className="flex flex-col items-center p-10">
                        <div className="flex items-center justify-between w-full max-w-sm p-6 mb-8 border border-gray-100 bg-gray-50 rounded-2xl">
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900">{checkoutClass.subject}</h3>
                                <p className="text-sm text-gray-500">{checkoutClass.teacher.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase">Amount</p>
                                <p className="text-2xl font-black text-brand-purple">LKR {checkoutClass.monthlyFee}</p>
                            </div>
                        </div>

                        {paymentMode === 'select' && (
                            <div className="w-full max-w-sm flex flex-col gap-4">
                                <button
                                    onClick={() => handlePayment(checkoutClass.id, currentMonth.id, checkoutClass.monthlyFee)}
                                    disabled={isProcessing}
                                    className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-all bg-purple-600 shadow-md rounded-xl hover:bg-purple-700 disabled:opacity-50 hover:-translate-y-1"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    {isProcessing ? "Processing Payment..." : "Pay with Card (PayHere)"}
                                </button>
                                
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">or</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <button
                                    onClick={() => setPaymentMode('slip')}
                                    className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-purple-600 transition-all bg-purple-50 border border-purple-100 shadow-sm rounded-xl hover:bg-purple-100 hover:-translate-y-1"
                                >
                                    <FileText className="w-5 h-5" />
                                    Upload Bank Slip
                                </button>
                            </div>
                        )}

                        {paymentMode === 'slip' && (
                            <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
                                <div className="mb-4 text-left">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Upload your Bank Deposit Slip</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setSlipFile(e.target.files[0])}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Accepted formats: JPG, PNG. Max 5MB.</p>
                                </div>
                                <button
                                    onClick={() => handleSlipUpload(checkoutClass.id, checkoutClass.monthlyFee)}
                                    disabled={isUploadingSlip || !slipFile}
                                    className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-all bg-purple-600 shadow-md rounded-xl hover:bg-purple-700 disabled:opacity-50 hover:-translate-y-1"
                                >
                                    {isUploadingSlip ? "Uploading..." : "Submit Bank Slip"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW 3: COURSE STRUCTURE 
    // ==========================================
    const classData = currentClass;
    console.log("Database Status Check:", classData?.status);
    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-in slide-in-from-right-4 duration-300">
            {/* Header: Back Button */}
            <button
                onClick={() => setSelectedClassId(null)}
                className="group mb-8 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-300 w-fit"
            >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Back to Dashboard
            </button>

            {/* Header: Class Info */}
            <div className="flex flex-col justify-between gap-6 p-6 mb-8 bg-white border border-gray-100 shadow-sm md:flex-row md:items-center rounded-2xl">
                <div className="flex items-center gap-6">
                    <img src={currentClass.teacher.image} alt={currentClass.teacher.name} className="object-cover w-20 h-20 shadow-md rounded-xl" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Active Portal
                            </span>
                            <span className="text-xs font-bold text-brand-purple bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {currentClass.grade}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold leading-tight text-gray-900">{currentClass.subject}</h1>
                        <p className="font-medium text-gray-500">By {currentClass.teacher.name}</p>
                    </div>
                </div>
                {/* Only show feedback if backend explicitly says 'completed' */}
                {classData?.status?.toLowerCase() === 'completed' && (
                    <div className="flex items-center">
                        {hasReviewed ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 cursor-default">
                                <CheckCircle className="w-4 h-4" /> Class Reviewed
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsFeedbackModalOpen(true)} 
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 font-bold rounded-xl hover:bg-yellow-100 transition-colors border border-yellow-200"
                            >
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> Rate Class
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Announcements Board */}
            {announcements && announcements.length > 0 && (
                <div className="mb-8 bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-blue-900 text-lg">Class Announcements</h3>
                        </div>
                        <span className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {announcements.length} New
                        </span>
                    </div>
                    
                    {/* Scrollable List */}
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-4 bg-gray-50/50">
                        <div className="space-y-3">
                            {announcements.map((announcement) => (
                                <div 
                                    key={announcement.id} 
                                    className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800 text-md">{announcement.title}</h4>
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 border border-gray-100 rounded-md">
                                            <Clock className="w-3 h-3" />
                                            {new Date(announcement.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                        {announcement.message}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                            {announcement.teacher_name ? announcement.teacher_name.charAt(0) : 'T'}
                                        </div>
                                        <p className="text-xs text-blue-700 font-semibold">
                                            Posted by {announcement.teacher_name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE COLUMN LAYOUT */}
            <div className="w-full mt-4">
                {currentClass.months.map((month, index) => (
                    <div key={month.id} className="mb-4 overflow-hidden bg-white border border-gray-300 shadow-sm rounded-xl">
                        {/* Module Header Row */}
                        <div
                            className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
                            onClick={() => setActiveMonth(activeMonth === month.id ? null : month.id)}
                        >
                            <h3 className="text-base font-bold text-gray-900">
                                {index + 1}. {month.name}
                            </h3>

                            {/* Action Buttons Group (Cleaned) */}
                            <div className="flex items-center text-gray-500">
                                <button className="transition-colors hover:text-gray-800">
                                    {activeMonth === month.id ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Expanded Area */}
                        {activeMonth === month.id && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                {(!month.lessons?.length && !month.assignments?.length && !month.quizzes?.length) ? (
                                    <p className="p-6 text-sm italic text-center text-gray-400">No content has been uploaded to this module yet.</p>
                                ) : (
                                    <div className="flex flex-col space-y-4">
                                        {/* LESSONS AND RESOURCES */}
                                        {month.lessons?.map(lesson => (
                                            <div key={lesson.id} className="mb-6">
                                                {/* Lesson Header */}
                                                <div onClick={() => toggleLesson(lesson.id)} className="flex items-center justify-between px-4 py-3 mb-3 transition-colors border border-gray-200 cursor-pointer bg-gray-50 rounded-xl hover:bg-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                        <h5 className="text-sm font-bold text-gray-800">{lesson.title}</h5>
                                                    </div>
                                                    {expandedLessons.includes(lesson.id) ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>

                                                {/* Nested Resources */}
                                                {expandedLessons.includes(lesson.id) && (
                                                    <div className="relative flex flex-col gap-2 pl-6 mb-4">
                                                        <div className="absolute left-[11px] top-0 bottom-4 w-px bg-gray-200"></div>
                                                        {lesson.resources?.map(resource => {
                                                            const embedUrl = resource.type === 'link' ? getYouTubeEmbedUrl(resource.link) : null;

                                                            if (embedUrl) {
                                                                return (
                                                                    <button key={resource.id} onClick={() => setPlayingVideoUrl(embedUrl)} className="relative z-10 flex items-center justify-between w-full p-3 ml-2 text-left transition-all bg-white border border-gray-200 shadow-sm cursor-pointer rounded-xl hover:border-purple-300 hover:bg-gray-50 group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 text-purple-600 rounded-lg bg-purple-50">
                                                                                <PlayCircle className="w-4 h-4 text-red-500" />
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-gray-700">{resource.name}</span>
                                                                        </div>
                                                                        <ChevronRight className="w-4 h-4 text-gray-300 transition-opacity opacity-0 group-hover:opacity-100" />
                                                                    </button>
                                                                );
                                                            }

                                                            return (
                                                                <a key={resource.id} href={getResourceDownloadUrl(resource)} target="_blank" rel="noreferrer" className="relative z-10 flex items-center justify-between p-3 ml-2 text-left transition-all bg-white border border-gray-200 shadow-sm cursor-pointer rounded-xl hover:border-blue-300 hover:bg-gray-50 group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 text-purple-600 rounded-lg bg-purple-50">
                                                                            {resource.type === 'link' ? <LinkIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                                        </div>
                                                                        <span className="text-sm font-semibold text-gray-700">{resource.name}</span>
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-gray-300 transition-opacity opacity-0 group-hover:opacity-100" />
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* ASSIGNMENTS HEADER */}
                                        {(month.assignments || []).length > 0 && (
                                            <div className="mt-6 mb-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ClipboardList className="w-5 h-5 text-purple-600" />
                                                    <h3 className="font-bold text-gray-800">Assignments</h3>
                                                </div>
                                                <hr className="border-gray-200" />
                                            </div>
                                        )}

                                        {/* ASSIGNMENTS */}
                                        {month.assignments?.map(assignment => {
                                            const isLocked = assignment.publish_at && new Date(assignment.publish_at) > new Date();
                                            const isPastDeadline = new Date(assignment.deadline) < new Date();
                                            return (
                                                <div
                                                    key={assignment.id}
                                                    onClick={() => !isLocked && !isPastDeadline && navigate(`/student/assignment/${assignment.id}`)}
                                                    className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl transition-all shadow-sm ${isLocked || isPastDeadline ? 'opacity-70 cursor-not-allowed' : 'hover:border-orange-300 hover:bg-orange-50 cursor-pointer group'} mb-2`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isLocked || isPastDeadline ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-600'}`}>
                                                            {isLocked ? <Lock className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-700">{assignment.title}</span>
                                                            {isLocked ? (
                                                                <span className="text-[10px] font-bold text-red-500">Locked until {new Date(assignment.publish_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                            ) : isPastDeadline ? (
                                                                <span className="text-[10px] font-bold text-red-500">Missed Deadline</span>
                                                            ) : (
                                                                <span className="text-[10px] font-medium text-gray-500">Due: {new Date(assignment.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!isLocked && !isPastDeadline && <ChevronRight className="w-5 h-5 text-gray-400 transition-colors group-hover:text-orange-500" />}
                                                </div>
                                            )
                                        })}

                                        {/* QUIZZES HEADER */}
                                        {(month.quizzes || []).length > 0 && (
                                            <div className="mt-6 mb-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                                    <h3 className="font-bold text-gray-800">Quizzes</h3>
                                                </div>
                                                <hr className="border-gray-200" />
                                            </div>
                                        )}

                                        {/* QUIZZES */}
                                        {(month.quizzes || []).length > 0 && (
                                            <div className="grid grid-cols-1 gap-4 mt-3 md:grid-cols-2">
                                                {month.quizzes.map((quiz, index) => {
                                                    const isLocked = quiz.publish_at && new Date(quiz.publish_at) > new Date();
                                                    let isPastDeadline = false;
                                                    if (quiz.publish_at) {
                                                        const publishDate = new Date(quiz.publish_at);
                                                        let timeLimitMs = 0;
                                                        if (quiz.timeLimit) {
                                                            const parts = quiz.timeLimit.split(':');
                                                            timeLimitMs = ((parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2])) * 1000;
                                                        }
                                                        isPastDeadline = new Date() > new Date(publishDate.getTime() + timeLimitMs);
                                                    }

                                                    return (
                                                        <div
                                                            key={quiz.id}
                                                            onClick={() => !isLocked && !isPastDeadline && navigate('/student', { state: { section: 'Assessments', startQuizId: quiz.id } })}
                                                            className={`border rounded-xl p-4 transition-all relative ${isLocked || isPastDeadline ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'bg-blue-50/50 hover:bg-white border-blue-100 hover:border-blue-300 hover:shadow-md cursor-pointer group/quiz'}`}
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    {isLocked ? <Lock size={14} className="text-gray-400" /> : <BookOpen size={14} className="text-gray-700" />}
                                                                    <h5 className="font-bold text-gray-800">{quiz.title || `Quiz #${quiz.number}`}</h5>
                                                                </div>
                                                                {quiz.timeLimit && (
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPastDeadline ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                        {isPastDeadline ? 'Missed Deadline' : quiz.timeLimit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1 text-[10px] mt-3">
                                                                {isLocked ? (
                                                                    <div className="flex items-center gap-1 font-medium text-red-500">
                                                                        <Clock size={12} />
                                                                        <span>Locked until {new Date(quiz.publish_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                                    </div>
                                                                ) : isPastDeadline ? (
                                                                    <div className="flex items-center gap-1 font-medium text-red-500">
                                                                        <AlertCircle size={12} />
                                                                        <span>Deadline Passed</span>
                                                                    </div>
                                                                ) : quiz.publish_at ? (
                                                                    <div className="flex items-center gap-1 font-medium text-gray-400">
                                                                        <Calendar size={12} />
                                                                        <span>Published {new Date(quiz.publish_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 font-medium text-gray-400">
                                                                        <CheckCircle size={12} />
                                                                        <span>Available Now</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {playingVideoUrl && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-200">
                    <div className="relative flex flex-col items-end w-full max-w-5xl">
                        <button
                            onClick={() => setPlayingVideoUrl(null)}
                            className="flex items-center gap-2 mb-4 font-bold text-white hover:text-gray-300"
                        >
                            <X size={24} /> Close Video
                        </button>
                        <div className="w-full overflow-hidden bg-black border border-gray-800 shadow-2xl aspect-video rounded-2xl">
                            <iframe
                                width="100%"
                                height="100%"
                                src={playingVideoUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {isFeedbackModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-3xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 text-white bg-gradient-to-r from-purple-600 to-indigo-600">
                            <h3 className="flex items-center gap-2 text-xl font-bold">
                                <MessageSquare size={20} /> Class Feedback
                            </h3>
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="text-2xl leading-none text-white/80 hover:text-white">&times;</button>
                        </div>

                        <div className="p-6">
                            <p className="mb-4 text-sm text-center text-gray-600">Your feedback helps the teacher improve!</p>

                            {/* Scrollable Form Area */}
                            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">

                                {/* 1. Star Rating */}
                                <div className="text-center">
                                    <label className="block mb-2 text-sm font-bold text-gray-700">Overall Rating</label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star} type="button"
                                                onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                                className="p-1 transition-transform focus:outline-none hover:scale-110"
                                            >
                                                <Star size={32} fill={star <= feedbackForm.rating ? "#EAB308" : "transparent"} color={star <= feedbackForm.rating ? "#EAB308" : "#CBD5E1"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* 2. MCQ Questions */}
                                <div className="space-y-6">
                                    {feedbackQuestions.map((q) => (
                                        <div key={q.id} className="p-4 bg-gray-50 rounded-xl">
                                            <p className="mb-3 text-sm font-bold text-gray-800">{q.text}</p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {q.options.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setFeedbackForm({
                                                            ...feedbackForm,
                                                            survey_responses: { ...feedbackForm.survey_responses, [q.id]: opt }
                                                        })}
                                                        className={`p-2 text-sm text-left rounded-lg border transition-colors ${feedbackForm.survey_responses[q.id] === opt
                                                                ? 'bg-purple-100 border-purple-500 text-purple-800 font-bold'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr className="border-gray-100" />

                                {/* 3. Written Review */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-1 text-sm font-bold text-gray-700">Headline (Optional)</label>
                                        <input
                                            type="text" placeholder="e.g., Excellent teaching style!"
                                            value={feedbackForm.title} onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                                            className="w-full p-3 border border-gray-200 outline-none rounded-xl focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-bold text-gray-700">Detailed Review (Optional)</label>
                                        <textarea
                                            rows="3" placeholder="What did you like the most?"
                                            value={feedbackForm.description} onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                                            className="w-full p-3 border border-gray-200 outline-none resize-none rounded-xl focus:border-purple-500"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button onClick={() => setIsFeedbackModalOpen(false)} className="px-5 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button
                                    onClick={async () => {
                                        if (Object.keys(feedbackForm.survey_responses).length < 10) {
                                            alert("Please answer all 10 questions before submitting.");
                                            return;
                                        }

                                        setIsSubmitting(true);

                                        try {
                                            const userId = localStorage.getItem('userId');
                                            if (!userId) {
                                                alert("You must be logged in to submit a review.");
                                                setIsSubmitting(false);
                                                return;
                                            }
                                            await api.post('/reviews', { ...feedbackForm, c_id: currentClass.id, s_id: userId });
                                            setIsFeedbackModalOpen(false);
                                            setHasReviewed(true);
                                            alert("Feedback submitted!");
                                        } catch (err) {
                                            if (err.response?.status === 409 || err.response?.data?.error?.includes('Duplicate')) {
                                                alert("You have already submitted a review for this class.");
                                                setHasReviewed(true);
                                                setIsFeedbackModalOpen(false);
                                            } else {
                                                alert("Failed to submit review.");
                                            }
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 font-bold rounded-xl text-white transition-colors ${isSubmitting ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

};

export default TuitionClass;