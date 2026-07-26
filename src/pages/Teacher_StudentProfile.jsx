import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    BookOpen, 
    Clock, 
    Award,
    Phone,
    MapPin,
    User,
    GraduationCap,
    Users,
    CalendarDays,
    Mail
} from 'lucide-react';
import api from '../api';

const Teacher_StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        try {
            const response = await api.get(`/teacher/student-profile/${id}`);
            const result = response.data;
            if (result.success) setData(result);
            else console.error("API returned success: false");
        } catch (error) {
            console.error("Failed to load student:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );
    if (!data) return null;

    const { profile, enrollments } = data;

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100/50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Icon size={18} strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="font-bold text-gray-800">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header & Navigation */}
            <div className="max-w-6xl mx-auto mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="group flex items-center text-gray-500 hover:text-indigo-600 font-bold transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-200 w-fit"
                >
                    <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
                    Back to Course
                </button>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center relative overflow-hidden group">
                        {/* Decorative background blur */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 transition-opacity group-hover:opacity-100"></div>
                        
                        <div className="relative pt-6">
                            <div className="relative inline-block">
                                <img 
                                    src={profile.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=200&background=random`} 
                                    alt={profile.name}
                                    className="w-36 h-36 rounded-[2rem] mx-auto object-cover border-[6px] border-white shadow-xl bg-white rotate-3 group-hover:rotate-0 transition-transform duration-500"
                                />
                                </div>
                            
                            <h2 className="text-3xl font-black text-gray-900 mt-6 tracking-tight">{profile.name}</h2>
                            <p className="text-gray-500 font-medium mt-1 flex items-center justify-center gap-2">
                                <Mail size={14} /> {profile.email}
                            </p>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/50">
                                    <div className="text-3xl font-black text-indigo-600">{enrollments.length}</div>
                                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">Total Courses Enrolled</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Enrollments */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Student Details Grid */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                                <User size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Student Details</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <DetailItem icon={Phone} label="Phone Number" value={profile.phone_number} />
                            <DetailItem icon={MapPin} label="Address" value={profile.address} />
                            <DetailItem icon={User} label="Gender" value={profile.gender} />
                            <DetailItem icon={GraduationCap} label="Grade Level" value={profile.grade_level} />
                            <DetailItem icon={Users} label="Guardian Name" value={profile.guardian_name} />
                            <DetailItem icon={CalendarDays} label="Join Date" value={profile.join_date ? new Date(profile.join_date).toLocaleDateString() : null} />
                        </div>
                    </div>

                    {/* Course Enrollments List */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white shadow-md">
                                <BookOpen size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Course Enrollments</h3>
                        </div>
                        
                        {enrollments.length > 0 ? (
                            <div className="space-y-4">
                                {enrollments.map((course, idx) => (
                                    <div 
                                        key={course.id} 
                                        className="group relative bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-pink-200 hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-xs group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                                                        {idx + 1}
                                                    </span>
                                                    <h4 className="font-black text-gray-800 text-xl group-hover:text-pink-600 transition-colors">{course.title}</h4>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm font-medium ml-11">
                                                    <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                                        <Clock size={14} className="text-gray-400" /> 
                                                        Enrolled: {new Date(course.enrolled_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50/50">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                                    <BookOpen size={24} className="text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-bold text-lg">This student is not enrolled in any courses yet.</p>
                                <p className="text-gray-400 text-sm mt-1">Enrollments will appear here automatically.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Teacher_StudentProfile;
