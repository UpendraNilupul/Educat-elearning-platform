import React from 'react';
import { BadgeCheck, Edit2 } from 'lucide-react';

const DashboardHeader = ({ userName = 'Damitha' }) => {
    // Segmented progress ring calculation
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const segments = 4;
    const gap = 4; // Gap between segments in pixels
    const segmentLength = (circumference - (segments * gap)) / segments;
    
    // For demonstration: 3 of 4 segments filled
    const progress = 75; 
    const dashArray = `${segmentLength} ${gap}`;

    return (
        <header className="flex items-center justify-between mb-8 bg-transparent">
            {/* Left Side: Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
            </div>

            {/* Right Side: Profile Widget */}
            <div className="flex items-center gap-4 bg-white p-3 pr-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                {/* Avatar with Segmented Progress Ring */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                    {/* Progress Ring Background */}
                    <svg className="absolute w-full h-full -rotate-90 transform" viewBox="0 0 52 52">
                        <circle
                            cx="26"
                            cy="26"
                            r={radius}
                            fill="transparent"
                            stroke="#f3f4f6"
                            strokeWidth="3.5"
                            strokeDasharray={dashArray}
                        />
                        {/* Progress Ring Foreground */}
                        <circle
                            cx="26"
                            cy="26"
                            r={radius}
                            fill="transparent"
                            stroke="#4a0b59"
                            strokeWidth="3.5"
                            strokeDasharray={dashArray}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-brand-purple font-bold text-lg overflow-hidden border-2 border-white shadow-inner">
                        <span className="relative z-10">{userName[0]}</span>
                    </div>
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-gray-900 font-semibold leading-none">
                        <span>{userName}</span>
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 font-medium italic">
                        Computer Science Undergraduate
                    </span>
                </div>

                {/* Edit Icon Button */}
                <button className="ml-2 p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-purple hover:bg-purple-50 transition-all border border-gray-100">
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
