import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    PlayCircle, Video, FileText, Download, Lock, CheckCircle, 
    ArrowLeft, ClipboardList, Clock, ChevronRight
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const Class = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Recordings');
    const [activeVideo, setActiveVideo] = useState(null);

    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/student/class-details/${classId}`, { withCredentials: true });
                setClassData(response.data.class);
                setIsEnrolled(response.data.isEnrolled);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching class details:", error);
                setLoading(false);
            }
        };
        fetchClassDetails();
    }, [classId]);

    const handlePayment = async (cId, amount) => {
        try {
            const userId = localStorage.getItem('userId') || 2; 
            const formattedAmount = parseFloat(amount).toFixed(2);
            const orderId = `${cId}_1_${userId}_${Date.now()}`;

            const hashRes = await fetch('http://localhost:3000/api/payment/generate-hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, amount: formattedAmount, currency: 'LKR' })
            });
            const hashData = await hashRes.json();

            const payment = {
                "sandbox": true,
                "merchant_id": "1234834",
                "return_url": "http://localhost:5173/student",
                "cancel_url": "http://localhost:5173/student",
                "notify_url": "https://shanae-unfetching-luisa.ngrok-free.dev/api/payment/notify", 
                "order_id": orderId,
                "items": `Enrollment Fee: ${cId}`,
                "amount": formattedAmount,
                "currency": "LKR",
                "hash": hashData.hash,
                "first_name": "Student",
                "last_name": "User",
                "email": "student@educat.com",
                "phone": "0771234567",
                "address": "Educat",
                "city": "Colombo",
                "country": "Sri Lanka"
            };

            window.payhere.onCompleted = () => { alert("Success!"); window.location.reload(); };
            window.payhere.startPayment(payment);
        } catch (error) { alert("Payment error."); }
    };

    if (loading) return <div className="p-20 text-center font-bold text-purple-600">Loading Portal...</div>;
    if (!classData) return <div className="p-20 text-center text-red-500 font-bold">Class not found!</div>;

    return (
        <div className="w-full flex flex-col bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="p-8 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigate('/student')} className="flex items-center gap-2 text-purple-600 font-bold hover:underline">
                        <ArrowLeft size={18} /> Back
                    </button>
                    {!isEnrolled && (
                        <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <span className="font-bold text-gray-700">LKR {classData.price}</span>
                            <button onClick={() => handlePayment(classData.c_id, classData.price)} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600 shadow-md">Pay Now</button>
                        </div>
                    )}
                </div>
                <div className="max-w-7xl mx-auto mt-6">
                    <h1 className="text-3xl font-black text-gray-900 uppercase">{classData.course_name}</h1>
                    <p className="text-gray-500 mt-1">{classData.description}</p>
                </div>
            </div>

            {/* Portal Content (Video Player & Tabs) */}
            {isEnrolled ? (
                <div className="p-8 max-w-[1500px] mx-auto w-full animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="aspect-video bg-black rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden">
                                {activeVideo ? <iframe src={activeVideo.link} className="w-full h-full" allowFullScreen></iframe> : (
                                    <div className="text-center text-white/40">
                                        <PlayCircle size={64} className="mx-auto mb-4" />
                                        <p className="font-bold uppercase tracking-widest text-sm">Select a lesson from the index</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
                                {['Recordings', 'Live Class', 'Assignments'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{tab}</button>
                                ))}
                            </div>
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm min-h-[250px]">
                                {activeTab === 'Recordings' && <p className="text-gray-500 font-medium italic">Welcome to the portal. Select a video to start.</p>}
                                {activeTab === 'Live Class' && <div className="text-center py-6"><Video size={48} className="mx-auto mb-4 text-blue-500" /><button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Open Zoom</button></div>}
                                {activeTab === 'Assignments' && <div className="text-center py-6 opacity-30"><ClipboardList size={48} className="mx-auto mb-4" /><p className="font-bold">No assignments found</p></div>}
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-[calc(100vh-250px)] sticky top-6">
                                <div className="p-5 border-b bg-gray-50 rounded-t-3xl font-black text-gray-900 uppercase text-sm tracking-tight">Index</div>
                                <div className="p-10 text-center text-gray-400"><Lock size={30} className="mx-auto mb-4 opacity-10" /><p className="text-xs font-bold uppercase tracking-widest">Index is empty</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-20 text-center">
                    <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 max-w-xl mx-auto">
                        <Lock size={60} className="mx-auto mb-6 text-gray-200" />
                        <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Portal Locked</h2>
                        <p className="text-gray-500 font-medium mb-8">Please complete the monthly payment to unlock the video player, live classes, and assignments.</p>
                        <button onClick={() => handlePayment(classData.c_id, classData.price)} className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg">MAKE A PAYMENT NOW</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Class;