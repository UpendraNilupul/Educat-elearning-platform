import React, { useState, useEffect } from 'react';
import { 
    PlayCircle, Video, FileText, Lock, CheckCircle, 
    ArrowLeft, ClipboardList, CreditCard
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const Class = () => {
    // State variables
    const [selectedClassId, setSelectedClassId] = useState(null); 
    const [checkoutClass, setCheckoutClass] = useState(null);     
    const [expandedPaymentClassId, setExpandedPaymentClassId] = useState(null);
    const [activeMonth, setActiveMonth] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('Recordings');

    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [suggestedClasses, setSuggestedClasses] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllClasses = async () => {
            try {
                const userId = localStorage.getItem('userId');
                
                const enrolledPromise = fetch(`http://localhost:3000/api/student/classes?userId=${userId}`, { credentials: 'include' });
                const suggestedPromise = fetch(`http://localhost:3000/api/suggested-classes`, { credentials: 'include' });

                const [enrolledRes, suggestedRes] = await Promise.all([enrolledPromise, suggestedPromise]);
                
                if (enrolledRes.ok) {
                    const enrolledData = await enrolledRes.json();
                    setEnrolledClasses(enrolledData);
                }

                if (suggestedRes.ok) {
                    const suggestedData = await suggestedRes.json();
                    const formattedSuggestions = suggestedData.map(cls => ({
                        ...cls,
                        months: [{ id: `m-sug-${cls.id}`, name: 'First Month', isPaid: false }]
                    }));
                    setSuggestedClasses(formattedSuggestions); 
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllClasses();
    }, []);

    const handleEnterPortal = (cls) => {
        const currentMonth = cls.months[0]; 
        if (currentMonth && currentMonth.isPaid) {
            setSelectedClassId(cls.id);
            setActiveMonth(currentMonth.id);
            if (currentMonth.videos?.length > 0) {
                setActiveVideo(currentMonth.videos[0]);
            }
        } else {
            if (expandedPaymentClassId === cls.id) {
                setExpandedPaymentClassId(null);
            } else {
                setExpandedPaymentClassId(cls.id);
            }
        }
    };

    const handlePayment = async (classToPay, amount) => {
        setIsProcessing(true);
        const studentId = localStorage.getItem('userId') || '1';
        const classId = classToPay.id;
        
        const orderId = `${classId}_1_${studentId}_${Date.now()}`;
        const formattedAmount = parseFloat(amount).toFixed(2);

        try {
            const hashResponse = await fetch('http://localhost:3000/api/payment/generate-hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, amount: formattedAmount, currency: "LKR" })
            });
            
            if (!hashResponse.ok) throw new Error("Hash fetch failed");
            const hashData = await hashResponse.json();

            const payment = {
                "sandbox": true, 
                "merchant_id": "1234834", 
                "return_url": "http://localhost:5173/student", 
                "cancel_url": "http://localhost:5173/student",
                "notify_url": "https://1895-175-157-19-158.ngrok-free.app/api/payment/notify", 
                "order_id": orderId,
                "items": `Tuition Fee for Class ${classId}`,
                "amount": formattedAmount,
                "currency": "LKR",
                "hash": hashData.hash, 
                "first_name": "Educat",
                "last_name": "Student",
                "email": "student@educat.com",
                "phone": "0771234567",
                "address": "Educat eLearning",
                "city": "Colombo",
                "country": "Sri Lanka",
            };

            window.payhere.onCompleted = async function(orderIdFromPayHere) {
                console.log("Payment completed. OrderID:" + orderIdFromPayHere);
                try {
                    await fetch('http://localhost:3000/api/payment/manual-success', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            order_id: orderIdFromPayHere, 
                            amount: formattedAmount, 
                            classId: classId, 
                            userId: studentId 
                        })
                    });
                } catch(e) { console.error(e); }

                alert("Payment Successful! Your class is now unlocked.");
                setIsProcessing(false);
                window.location.reload(); 
            };

            window.payhere.startPayment(payment);
        } catch (error) {
            alert("Error preparing payment.");
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-[600px] items-center justify-center font-bold text-brand-purple animate-pulse">Loading lessons...</div>;
    }

    // 🌟 1. Enroll වෙලා ඉන්න පන්ති ලැයිස්තුව
    const paidClasses = enrolledClasses.map(cls => ({
        ...cls, 
        months: [{...(cls.months ? cls.months[0] : {}), isPaid: true, name: 'Active Month'}]
    }));
    
    // 🌟 2. Enroll වෙලා ඉන්න පන්ති ටික "Suggested" එකෙන් අයින් කිරීම (Filtering)
    const enrolledIds = paidClasses.map(cls => cls.id);
    const filteredSuggested = suggestedClasses.filter(cls => !enrolledIds.includes(cls.id));
    
    const currentClass = paidClasses.find(c => c.id === selectedClassId);

    // ==========================================
    // VIEW 1: MAIN GRID (පන්ති කාඩ්පත් ටික)
    // ==========================================
    if (!selectedClassId && !checkoutClass) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">My Lessons</h1>
                    <p className="text-gray-500 mt-2 font-medium">Access your class portals, discover new topics, and manage payments.</p>
                </div>

                {paidClasses.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-gray-900">Enrolled Classes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paidClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden relative">
                                    <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-emerald-50/30 to-white">
                                        <img src={cls.teacher?.image || 'https://ui-avatars.com/api/?name=Teacher'} alt={cls.teacher?.name} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher?.name || 'Instructor'}</h3>
                                            <p className="text-xs font-semibold text-gray-500 mt-1">{cls.grade}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h2 className="text-xl font-black text-gray-900 mb-4">{cls.subject}</h2>
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
                {filteredSuggested.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <CheckCircle className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-bold text-gray-900">Suggested Classes for You</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSuggested.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden relative group">
                                    <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-orange-50/50 to-white">
                                        <img src={cls.teacher?.image || 'https://ui-avatars.com/api/?name=Teacher'} alt={cls.teacher?.name} className="w-16 h-16 rounded-xl shadow-sm object-cover" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher?.name || 'Instructor'}</h3>
                                            <p className="text-xs font-semibold text-gray-500 mt-1">{cls.grade}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h2 className="text-xl font-black text-gray-900 mb-4">{cls.subject}</h2>
                                        
                                        <button 
                                            onClick={() => setCheckoutClass(cls)}
                                            className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-md"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Enroll Now (Rs. {cls.monthlyFee || 2500})
                                        </button>
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
    // VIEW 2: CHECKOUT (පේමන්ට් පිටුව)
    // ==========================================
    if (checkoutClass) {
        return (
            <div className="p-8 max-w-[800px] mx-auto animate-in slide-in-from-bottom-4 duration-300">
                <button 
                    onClick={() => setCheckoutClass(null)} 
                    className="group mb-8 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 px-5 py-2.5 rounded-xl hover:bg-purple-600 hover:text-white transition-all w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Lessons
                </button>
                
                <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden text-center">
                    <div className="bg-gray-50 py-12 px-6 border-b border-gray-100 flex flex-col items-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <Lock className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Class Portal Locked</h2>
                        <p className="text-gray-500 text-lg max-w-md">
                            You need to enroll and pay the class fees to enter the portal.
                        </p>
                    </div>

                    <div className="p-10 flex flex-col items-center">
                        <div className="w-full max-w-sm bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 flex justify-between items-center">
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900">{checkoutClass.subject}</h3>
                                <p className="text-sm text-gray-500">{checkoutClass.teacher?.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase">Amount</p>
                                <p className="text-2xl font-black text-brand-purple">Rs. {checkoutClass.monthlyFee || 2500}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handlePayment(checkoutClass, checkoutClass.monthlyFee || 2500)}
                            disabled={isProcessing}
                            className="w-full max-w-sm py-4 bg-purple-600 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1"
                        >
                            <CreditCard className="w-5 h-5" />
                            {isProcessing ? "Processing..." : "Pay via PayHere"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW 3: INSIDE THE CLASS PORTAL (ඔයාගේ SCREENSHOT එකේ UI එක)
    // ==========================================
    return (
        <div className="p-8 max-w-[1500px] mx-auto w-full animate-in slide-in-from-right-4 duration-500">
            
            <button 
                onClick={() => { setSelectedClassId(null); setActiveTab('Recordings'); }}
                className="group mb-8 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-600 hover:text-white transition-all duration-300 w-fit"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> 
                Back to Lessons
            </button>

            {/* ගුරුවරයාගේ විස්තර */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <img src={currentClass?.teacher?.image || 'https://ui-avatars.com/api/?name=Teacher'} alt="Teacher" className="w-20 h-20 rounded-xl shadow-md object-cover" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="w-3 h-3"/> Active Portal
                            </span>
                            <span className="text-xs font-bold text-brand-purple bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {currentClass?.grade || 'Grade'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{currentClass?.subject || 'Class Subject'}</h1>
                        <p className="text-gray-500 font-medium">By {currentClass?.teacher?.name || 'Instructor'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* වම් පැත්ත */}
                <div className="lg:col-span-3 space-y-6">
                    {/* අර කළු පාට ලොකු Video Player එක */}
                    <div className="aspect-video bg-black rounded-[32px] shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden relative group">
                        {activeVideo ? (
                            <iframe src={activeVideo.link} className="w-full h-full" allowFullScreen></iframe>
                        ) : (
                            <div className="text-center text-white/30 group-hover:text-white/50 transition-colors">
                                <PlayCircle size={80} className="mx-auto mb-4 stroke-1" />
                                <p className="font-black uppercase tracking-[0.2em] text-sm">Select a lesson to start learning</p>
                            </div>
                        )}
                    </div>

                    {/* Tabs 4ම තියෙනවා (Assignments ඇතුළුව) */}
                    <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
                        {['Recordings', 'Live Class', 'Assignments', 'Tutes'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm min-h-[300px]">
                        {activeTab === 'Recordings' && (
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-4 uppercase italic">Lesson Recordings</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">පහත ලැයිස්තුවෙන් ඔබට නැරඹීමට අවශ්‍ය වීඩියෝව තෝරාගන්න.</p>
                                
                                {/* මෙතන Video List එක එනවා */}
                                {currentClass?.months?.[0]?.videos && currentClass.months[0].videos.length > 0 ? (
                                    <div className="mt-6 space-y-3">
                                        {currentClass.months[0].videos.map(video => (
                                            <div key={video.id} onClick={() => setActiveVideo(video)} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer group">
                                                <PlayCircle className="text-purple-400 group-hover:text-purple-600 w-8 h-8" />
                                                <h4 className="font-bold text-gray-800">{video.title}</h4>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 opacity-50">
                                        <p className="font-bold text-gray-400">No videos uploaded yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'Live Class' && (
                            <div className="text-center py-12">
                                <Video size={56} className="mx-auto mb-6 text-blue-500" />
                                <button className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-blue-700 active:scale-95 transition-all">JOIN ZOOM CLASS NOW</button>
                            </div>
                        )}
                        {activeTab === 'Assignments' && (
                            <div className="text-center py-12 opacity-40">
                                <ClipboardList size={56} className="mx-auto mb-4 text-gray-300" />
                                <p className="font-black uppercase tracking-widest text-gray-400">No Assignments Uploaded Yet</p>
                            </div>
                        )}
                        {activeTab === 'Tutes' && (
                            <div className="text-center py-12 opacity-40">
                                <FileText size={56} className="mx-auto mb-4 text-gray-300" />
                                <p className="font-black uppercase tracking-widest text-gray-400">No Tutes Available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* දකුණු පැත්තේ Index එක */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm h-[calc(100vh-200px)] sticky top-8 flex flex-col overflow-hidden">
                        <div className="p-6 border-b bg-gray-50 font-black text-gray-900 uppercase text-sm tracking-widest flex items-center justify-between">
                            Class Content Index
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/30">
                            {/* මෙතන අර videos ටික පෙන්වනවා */}
                            {currentClass?.months?.[0]?.videos && currentClass.months[0].videos.length > 0 ? (
                                currentClass.months[0].videos.map(video => (
                                    <button 
                                        key={video.id} 
                                        onClick={() => {setActiveVideo(video); setActiveTab('Recordings');}}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${activeVideo?.id === video.id ? 'bg-white border-purple-300 shadow-sm' : 'bg-transparent border-transparent hover:bg-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <PlayCircle className={`w-5 h-5 ${activeVideo?.id === video.id ? 'text-purple-600' : 'text-gray-400'}`} />
                                            <span className={`text-sm font-bold ${activeVideo?.id === video.id ? 'text-gray-900' : 'text-gray-600'}`}>{video.title}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-300 opacity-50 p-6">
                                    <Lock size={40} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest leading-loose">
                                        Content will appear here<br/>when uploaded
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Class;