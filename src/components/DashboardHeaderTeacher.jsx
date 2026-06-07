import React from 'react';
import { BadgeCheck } from 'lucide-react';

const DashboardHeaderTeacher = ({ userName = 'Damitha' }) => {
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
           
        </header>
    );
};

export default DashboardHeaderTeacher;
