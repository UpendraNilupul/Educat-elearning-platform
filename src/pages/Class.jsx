import React, { useState } from 'react';
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
    Users
} from 'lucide-react';

const TuitionClass = () => {
    // State to track which view we are on
    const [selectedClassId, setSelectedClassId] = useState(null);
    
    // State for the detailed view
    const [activeMonth, setActiveMonth] = useState('March');
    const [activeVideo, setActiveVideo] = useState(1);
    const [activeTab, setActiveTab] = useState('Recordings');

    // Mock Data: List of classes this student has paid for/enrolled in
    const enrolledClasses = [
        {
            id: 1,
            grade: 'Grade 9',
            subject: 'Mathematics',
            teacher: {
                name: 'Mr. Bhanuka Gunarathna',
                image: 'https://ui-avatars.com/api/?name=Bhanuka+Gunarathna&background=4a0b59&color=fff'
            },
            monthlyFee: 2500,
            schedule: 'Every Sunday 8:00 AM - 11:00 AM',
            zoomLink: 'https://zoom.us/j/123456789',
            studentsCount: 1240,
            months: [
                {
                    id: 'March', name: 'March 2026', isPaid: true, topics: 'Algebraic Fractions & Graphs',
                    videos: [
                        { id: 1, title: 'Week 1: Introduction to Algebraic Fractions', date: 'March 01', duration: '2h 15m' },
                        { id: 2, title: 'Week 2: Addition and Subtraction', date: 'March 08', duration: '2h 30m' },
                    ],
                    tutes: [
                        { id: 1, name: 'March_Week_1_Tute.pdf', type: 'Theory', size: '2.4 MB' },
                    ]
                },
                {
                    id: 'April', name: 'April 2026', isPaid: false, topics: 'Geometry & Theorems',
                    videos: [
                        { id: 3, title: 'Week 1: Angles and Straight Lines', date: 'April 05', duration: '2h 20m' },
                    ],
                    tutes: []
                }
            ]
        },
        {
            id: 2,
            grade: 'Grade 9',
            subject: 'Science',
            teacher: {
                name: 'Mr. Ravin Tharuka',
                image: 'https://ui-avatars.com/api/?name=Ravin+Tharuka&background=0ea5e9&color=fff'
            },
            monthlyFee: 2000,
            schedule: 'Every Tuesday 3:30 PM - 6:00 PM',
            zoomLink: 'https://zoom.us/j/987654321',
            studentsCount: 850,
            months: [
                {
                    id: 'March', name: 'March 2026', isPaid: true, topics: 'Human Digestive System',
                    videos: [
                        { id: 4, title: 'Week 1: Enzymes and Digestion', date: 'March 03', duration: '2h 00m' },
                    ],
                    tutes: [
                        { id: 2, name: 'Digestive_System_Note.pdf', type: 'Theory', size: '5.1 MB' },
                    ]
                }
            ]
        }
    ];

    // Get the data for the currently selected class
    const currentClass = enrolledClasses.find(c => c.id === selectedClassId);
    const currentMonthData = currentClass?.months.find(m => m.id === activeMonth) || currentClass?.months[0];

    // ==========================================
    // VIEW 1: GRID OF ENROLLED CLASSES
    // ==========================================
    if (!selectedClassId) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">My Enrolled Classes</h1>
                    <p className="text-gray-500 mt-2 font-medium">Select a class to access live links, recordings, and tutes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledClasses.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden">
                            {/* Card Header (Teacher Banner) */}
                            <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
                                <img 
                                    src={cls.teacher.image} 
                                    alt={cls.teacher.name}
                                    className="w-16 h-16 rounded-xl shadow-md object-cover group-hover:scale-105 transition-transform"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{cls.teacher.name}</h3>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mt-1">
                                        <Users className="w-3.5 h-3.5" />
                                        {cls.studentsCount} Students
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold text-brand-purple bg-purple-50 px-2 py-1 rounded uppercase tracking-wider">
                                        {cls.grade}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-gray-900 mb-4 group-hover:text-brand-purple transition-colors">
                                    {cls.subject}
                                </h2>
                                
                                <div className="mt-auto bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Live Schedule</p>
                                        <p className="text-sm font-semibold text-gray-700">{cls.schedule}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        setSelectedClassId(cls.id);
                                        setActiveMonth(cls.months[0].id); // Reset month tab
                                    }}
                                    className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-purple transition-all shadow-md active:scale-95"
                                >
                                    Enter Class Portal
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ==========================================
    // VIEW 2: DETAILED CLASS VIEW
    // ==========================================
    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4 duration-300">
            
            {/* Back Button */}
            <button 
                onClick={() => setSelectedClassId(null)}
                className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm w-fit hover:border-purple-200"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to My Classes
            </button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <img 
                        src={currentClass.teacher.image} 
                        alt={currentClass.teacher.name}
                        className="w-20 h-20 rounded-xl shadow-md object-cover"
                    />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-brand-purple bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {currentClass.grade}
                            </span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {currentClass.subject}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                            {currentClass.grade} {currentClass.subject}
                        </h1>
                        <p className="text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                            By {currentClass.teacher.name}
                        </p>
                    </div>
                </div>
                
                {/* Quick Class Info */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Live Class Schedule</p>
                        <p className="text-sm font-semibold text-gray-900">{currentClass.schedule}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Main Viewing Area (Spans 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                        {['Recordings', 'Live Class', 'Tutes', 'Payments'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab 
                                        ? 'bg-purple-50 text-brand-purple' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {tab === 'Recordings' && <PlayCircle className="w-4 h-4" />}
                                {tab === 'Live Class' && <Video className="w-4 h-4" />}
                                {tab === 'Tutes' && <FileText className="w-4 h-4" />}
                                {tab === 'Payments' && <CreditCard className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Area */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                        
                        {/* 1. RECORDINGS TAB */}
                        {activeTab === 'Recordings' && (
                            <div className="flex flex-col h-full">
                                {currentMonthData.isPaid ? (
                                    <>
                                        <div className="bg-gray-900 aspect-video relative group flex items-center justify-center">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-transparent opacity-50"></div>
                                            <button className="relative z-10 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-brand-purple hover:border-brand-purple transition-all duration-300">
                                                <PlayCircle className="w-10 h-10 ml-1" />
                                            </button>
                                        </div>
                                        <div className="p-6">
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-3 inline-block">
                                                {currentMonthData.name} Recording
                                            </span>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {currentMonthData.videos.find(v => v.id === activeVideo)?.title || 'Select a video'}
                                            </h2>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                            <Lock className="w-10 h-10 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Month Locked</h3>
                                        <p className="text-gray-500 max-w-md">
                                            You need to pay the class fees for {currentMonthData.name} to access these recordings and tutes.
                                        </p>
                                        <button 
                                            onClick={() => setActiveTab('Payments')}
                                            className="mt-6 px-6 py-3 bg-brand-purple text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md"
                                        >
                                            Pay Rs. {currentClass.monthlyFee} Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. LIVE CLASS TAB */}
                        {activeTab === 'Live Class' && (
                            <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
                                    <Video className="w-10 h-10 text-blue-600 relative z-10" />
                                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-50"></div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Live Class</h2>
                                <p className="text-gray-500 mb-8 max-w-md">
                                    The live class is conducted via Zoom. Please make sure you join 5 minutes before the scheduled time.
                                </p>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 w-full max-w-md mb-8">
                                    <p className="text-sm font-bold text-gray-900">{currentClass.schedule}</p>
                                </div>
                                <a 
                                    href={currentClass.zoomLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                                >
                                    <Video className="w-5 h-5" />
                                    Open Zoom Link
                                </a>
                            </div>
                        )}

                        {/* 3. TUTES TAB */}
                        {activeTab === 'Tutes' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Class Tutes & Materials - {currentMonthData.name}</h2>
                                {currentMonthData.isPaid ? (
                                    <div className="space-y-3">
                                        {currentMonthData.tutes.length > 0 ? currentMonthData.tutes.map(tute => (
                                            <div key={tute.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-purple-100 text-brand-purple rounded-xl">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 group-hover:text-brand-purple transition-colors">{tute.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">{tute.type}</span>
                                                            <span className="text-xs text-gray-400 font-medium">{tute.size}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="p-2.5 text-brand-purple bg-purple-100 hover:bg-brand-purple hover:text-white rounded-lg transition-all shadow-sm">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )) : (
                                            <p className="text-gray-500 text-center py-8">No tutes uploaded for this month yet.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-red-900">Tutes Locked</h4>
                                            <p className="text-sm text-red-700 mt-1">Please complete your payment for {currentMonthData.name} to download the class materials.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. PAYMENTS TAB */}
                        {activeTab === 'Payments' && (
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Fees</h2>
                                <div className="space-y-4">
                                    {currentClass.months.map(month => (
                                        <div key={month.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border border-gray-100 bg-gray-50 gap-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{month.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1 font-medium">{month.topics}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-gray-900">Rs. {currentClass.monthlyFee}</span>
                                                {month.isPaid ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase">
                                                        <CheckCircle className="w-4 h-4" /> Paid
                                                    </span>
                                                ) : (
                                                    <button className="px-6 py-2 bg-brand-purple text-white text-sm font-bold rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                                                        Pay Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Monthly Index (Sidebar) */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-6">
                        
                        <div className="p-5 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">Class Content</h3>
                            <p className="text-xs text-gray-500 mt-1">Select a month to view recordings</p>
                        </div>

                        {/* Months Accordion */}
                        <div className="overflow-y-auto flex-1 p-3 space-y-2">
                            {currentClass.months.map((month) => (
                                <div key={month.id} className="rounded-xl border border-gray-100 overflow-hidden">
                                    <button 
                                        onClick={() => setActiveMonth(month.id)}
                                        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                                            activeMonth === month.id ? 'bg-purple-50' : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`text-sm font-bold ${activeMonth === month.id ? 'text-brand-purple' : 'text-gray-900'}`}>
                                                    {month.name}
                                                </h4>
                                                {!month.isPaid && <Lock className="w-3 h-3 text-red-400" />}
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium truncate pr-4">{month.topics}</p>
                                        </div>
                                        {activeMonth === month.id ? (
                                            <ChevronUp className="w-5 h-5 text-brand-purple shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                                        )}
                                    </button>

                                    {/* Video List inside Month */}
                                    {activeMonth === month.id && (
                                        <div className="bg-white py-2 border-t border-gray-50">
                                            {month.videos.map((video) => (
                                                <button 
                                                    key={video.id}
                                                    onClick={() => {
                                                        setActiveVideo(video.id);
                                                        setActiveTab('Recordings');
                                                    }}
                                                    disabled={!month.isPaid}
                                                    className={`w-full flex items-start gap-3 p-3 pl-5 text-left transition-colors group ${
                                                        !month.isPaid ? 'opacity-50 cursor-not-allowed' : ''
                                                    } ${
                                                        activeVideo === video.id && activeTab === 'Recordings'
                                                            ? 'bg-purple-50/50 border-l-4 border-brand-purple' 
                                                            : 'border-l-4 border-transparent hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <PlayCircle className={`w-4 h-4 mt-0.5 shrink-0 ${activeVideo === video.id && activeTab === 'Recordings' ? 'text-brand-purple' : 'text-gray-400'}`} />
                                                    <div>
                                                        <p className={`text-sm font-semibold line-clamp-2 ${activeVideo === video.id && activeTab === 'Recordings' ? 'text-brand-purple' : 'text-gray-700'}`}>
                                                            {video.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-gray-400">
                                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {video.date}</span>
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {video.duration}</span>
                                                        </div>
                                                    </div>
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
        </div>
    );
};

export default TuitionClass;
