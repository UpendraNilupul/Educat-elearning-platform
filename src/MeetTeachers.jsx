import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const MeetTeachers = () => {
    const teachers = [
        {
            id: 1,
            quote: "Advancing students' academic experience with innovative teaching methods and personalized guidance in physics.",
            image: "/teacher3.png",
            subject: "PHYSICS",
            name: "Pasindu Kumara"
        },
        {
            id: 2,
            quote: "Dedicated to fostering a deep understanding of mathematical concepts through interactive problem-solving and logic.",
            image: "/teacher2.png",
            subject: "MATHEMATICS",
            name: "Punsara Yasith"
        },
        {
            id: 3,
            quote: "Exploring the complexities of biological systems with a focus on practical applications and modern research techniques.",
            image: "/teacher1.png",
            subject: "BIOLOGY",
            name: "Amali Perera"
        },
        {
            id: 4,
            quote: "Inspiring the next generation of chemists by bridging the gap between theoretical knowledge and real-world experiments.",
            image: "/teacher4.png",
            subject: "CHEMISTRY",
            name: "Kasun Fernando"
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % teachers.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [teachers.length]);

    return (
        <section className="w-full bg-white py-16 px-4 md:px-8">
            <div className="container mx-auto">
                {/* Header Area */}
                <div className="flex justify-between items-end mb-2">
                    <div className="relative">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#4a0b59] pb-2">
                            Meet the teachers
                        </h2>
                    </div>
                    <a href="#all-teachers" className="text-sm md:text-base text-gray-500 hover:text-[#4a0b59] transition-colors mb-2">
                        View all teachers
                    </a>
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
                                    {/* Left Side: Quote */}
                                    <div className="w-full md:w-1/2 flex flex-col items-start text-left">
                                        <Quote size={64} className="text-[#4a0b59]/10 mb-6 -ml-2" strokeWidth={1.5} />
                                        <p className="text-xl md:text-2xl italic text-gray-600 leading-relaxed font-light">
                                            "{teacher.quote}"
                                        </p>
                                    </div>

                                    {/* Right Side: Portrait and Info */}
                                    <div className="w-full md:w-1/2 flex flex-col items-center">
                                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500">
                                            <img
                                                src={teacher.image}
                                                alt={teacher.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-[#4ade80] text-lg font-bold uppercase tracking-wider mb-1">
                                                {teacher.subject}
                                            </h3>
                                            <h4 className="text-2xl font-black text-[#4a0b59]">
                                                {teacher.name}
                                            </h4>
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

