import React, { useState } from 'react';
import { FlaskConical, Calculator, Monitor, Languages, Menu, X } from 'lucide-react';

const WelcomeSection = () => {
    const [activeTab, setActiveTab] = useState('Advanced Level');

    const categories = [
        { icon: <FlaskConical size={48} />, name: 'Science' },
        { icon: <Calculator size={48} />, name: 'Maths' },
        { icon: <Monitor size={48} />, name: 'IT' },
        { icon: <Languages size={48} />, name: 'English' },
    ];

    return (
        <section className="w-full bg-white">
            {/* Top Tabs Bar */}
            <div className="w-full border-t border-b border-gray-200">
                <div className="flex justify-center space-x-12 py-4">
                    {['Advanced Level', 'Courses'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-lg font-semibold transition-all relative ${activeTab === tab ? 'text-[#4a0b59]' : 'text-[#4a0b59]/60 hover:text-[#4a0b59]'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute -bottom-[17px] left-0 right-0 h-1 bg-[#4a0b59]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16 text-center">
                {/* Heading */}
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    <span className="text-[#4a0b59]">Welcome to </span>
                    <span className="text-[#ed8936]">EduCat</span>
                    <span className="text-[#4a0b59]"> Learning Platform</span>
                </h2>

                {/* Placeholder Text */}
                <div className="max-w-2xl mx-auto mb-16 text-gray-400 text-sm leading-relaxed">
                    <p>
                        Experience a transformation in your learning journey with world-class faculty and cutting-edge resources.
                    </p>
                    <p>
                        We are dedicated to providing excellence in education and empowering students to achieve their dreams.
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {categories.map((category) => (
                        <div
                            key={category.name}
                            className="flex flex-col items-center group cursor-pointer"
                        >
                            <div className="text-[#ed8936] mb-4 transition-transform group-hover:scale-110 duration-300">
                                {category.icon}
                            </div>
                            <h3 className="text-xl font-bold text-[#4a0b59]">
                                {category.name}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WelcomeSection;
