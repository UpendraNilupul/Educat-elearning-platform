import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';

import api from '../api';

const MeetTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const response = await api.get('/teachers');
                if (response.data && response.data.success) {
                    setTeachers(response.data.teachers);
                }
            } catch (error) {
                console.error('Error fetching teachers:', error);
            }
        };
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (teachers.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % teachers.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [teachers.length]);

    if (teachers.length === 0) {
        return null; // Or a loading spinner
    }

    const API_BASE = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : 'http://localhost:3000';

    return (
        <section id="teachers" className="w-full bg-white py-16 px-4 md:px-8 scroll-mt-24">
            <div className="container mx-auto">
                {/* Header Area */}
                <div className="flex justify-between items-end mb-2">
                    <div className="relative">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#4a0b59] pb-2">
                            Meet the teachers
                        </h2>
                    </div>
                    <Link to="/teachers" className="text-sm md:text-base text-gray-500 hover:text-[#4a0b59] transition-colors mb-2">
                        View all teachers
                    </Link>
                </div>

                {/* Specialized Underline */}
                <div className="w-full h-[1px] bg-gray-200 mb-12 relative">
                    <div className="absolute top-0 left-0 w-32 md:w-48 h-1 bg-[#4ade80] -translate-y-[1.5px]"></div>
                </div>

                {/* Carousel Container */}
                <div className="overflow-hidden w-full">
                    <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {teachers.map((teacher) => (
                            <div key={teacher.id} className="min-w-full flex-shrink-0 px-2">
                                <div className="bg-[#fcfdfd] border border-gray-50 rounded-2xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto mb-4">
                                    {/* Left Side: Portrait and Info */}
                                    <div className="w-full md:w-1/3 flex flex-col items-center">
                                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500 bg-gray-100 flex items-center justify-center">
                                            <img
                                                src={teacher.picture ? (teacher.picture.startsWith('http') ? teacher.picture : `${API_BASE}/${teacher.picture.replace(/^\//, '')}`) : '/default-avatar.png'}
                                                alt={teacher.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = '/default-avatar.png' }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-2xl font-black text-[#4a0b59]">
                                                {teacher.name}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Right Side: Details */}
                                    <div className="w-full md:w-2/3 flex flex-col items-start text-left space-y-4">
                                        <Quote size={48} className="text-[#4a0b59]/10 -ml-2" strokeWidth={1.5} />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
                                            {teacher.email && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Email</span>
                                                    <span className="text-lg text-gray-800 break-all">{teacher.email}</span>
                                                </div>
                                            )}
                                            {teacher.phone_number && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Phone</span>
                                                    <span className="text-lg text-gray-800">{teacher.phone_number}</span>
                                                </div>
                                            )}
                                            {teacher.highest_qualification && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Highest Qualification</span>
                                                    <span className="text-lg text-gray-800">{teacher.highest_qualification}</span>
                                                </div>
                                            )}
                                            {teacher.university && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">University</span>
                                                    <span className="text-lg text-gray-800">{teacher.university}</span>
                                                </div>
                                            )}
                                            {teacher.experience_years && (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Experience</span>
                                                    <span className="text-lg text-gray-800">{teacher.experience_years} Years</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Carousel Indicator Dots */}
                <div className="flex justify-center space-x-3 mt-8">
                    {teachers.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${currentIndex === index ? 'bg-[#4ade80]' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MeetTeachers;

