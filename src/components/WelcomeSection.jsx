import React from 'react';
import { BookOpen, BookMarked, GraduationCap } from 'lucide-react';

const WelcomeSection = () => {
    const levelsData = [
        { 
            name: 'Primary', 
            description: 'Laying a strong foundation for lifelong learning with engaging and interactive content.',
            icon: <BookOpen size={48} /> 
        },
        { 
            name: 'Ordinary Level (O/L)', 
            description: 'Comprehensive preparation designed to build confidence and ensure exam success.',
            icon: <BookMarked size={48} /> 
        },
        { 
            name: 'Advanced Level (A/L)', 
            description: 'Specialized subject mastery to propel you towards your higher education goals.',
            icon: <GraduationCap size={48} /> 
        },
    ];

    return (
        <section className="w-full bg-[#f9f8f4] py-20">
            <div className="container mx-auto px-4 text-center max-w-6xl">
                
                {/* Heading */}
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                    <span className="text-[#4a0b59]">Welcome to </span>
                    <span className="text-[#ed8936]">EduCat</span>
                    <span className="text-[#4a0b59]"> Learning Platform</span>
                </h2>

                {/* Placeholder Text */}
                <div className="max-w-3xl mx-auto mb-16 text-gray-600 text-base md:text-lg leading-relaxed">
                    <p className="mb-2">
                        Experience a transformation in your learning journey with world-class faculty and cutting-edge resources.
                    </p>
                    <p>
                        We are dedicated to providing excellence in education and empowering students to achieve their dreams across all levels of study.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {levelsData.map((level, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-sm border border-gray-100 group cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#ed8936]/50 hover:-translate-y-2 relative overflow-hidden"
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f9f8f4] rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500 ease-out z-0"></div>

                            <div className="text-[#ed8936] mb-6 transition-transform group-hover:scale-110 group-hover:text-[#4a0b59] duration-300 z-10 bg-[#fff5eb] p-5 rounded-2xl group-hover:bg-[#f3e8f5]">
                                {level.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-[#4a0b59] mb-4 z-10">
                                {level.name}
                            </h3>
                            <p className="text-gray-500 leading-relaxed z-10">
                                {level.description}
                            </p>
                        </div>
                    ))}
                </div>
                
            </div>
        </section>
    );
};

export default WelcomeSection;
