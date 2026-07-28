import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ end, duration = 2000, shouldStart }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!shouldStart) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration, shouldStart]);

    return <span>{count.toLocaleString()}</span>;
};

const StatsCTA = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    // 1. ඇත්ත දත්ත (Real data) තියාගන්න State එකක් හදමු
    const [realStats, setRealStats] = useState({
        students: 0,
        teachers: 0,
        courses: 0
    });

    // 2. Component එක ලෝඩ් වෙද්දි Backend එකෙන් දත්ත ගේනවා
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/public/stats');
                const data = await response.json();
                setRealStats(data);
            } catch (error) {
                console.error("Error fetching real stats:", error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    // 3. ඔරිජිනල් Array එකට Database එකෙන් ආපු ගණන් ටික (target විදිහට) දානවා
    const stats = [
        { label: 'CLASSES', target: realStats.courses, subtext: 'Interactive and engaging lessons' },
        { label: 'STUDENTS', target: realStats.students, subtext: 'Across the island and beyond' },
        { label: 'TEACHERS', target: realStats.teachers, subtext: 'Professional academic experts' },
    ];

    return (
        <section className="w-full bg-[#4a0b59] text-white overflow-hidden">
            {/* Top Half: CTA */}
            <div className="container mx-auto px-4 md:px-8 py-16 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Excellence in education, every day
                    </h2>
                    <p className="text-purple-200 text-sm md:text-base max-w-md">
                        Download our app to access exclusive course materials and track your learning progress on the go.
                    </p>
                </div>
                <div className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300">
                    <img
                        src="/google-play.png"
                        alt="Get it on Google Play"
                        className="h-16 md:h-20 object-contain shadow-xl rounded-xl"
                    />
                </div>
            </div>

            {/* Bottom Half: Stats Grid with Gradient and Animation */}
            <div
                ref={sectionRef}
                className="w-full bg-gradient-to-r from-[#31073b] via-[#4a0b59] to-[#2c0635] border-t border-white/10"
            >
                <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {stats.map((stat, idx) => (
                            <div
                                key={idx}
                                className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10"
                            >
                                <span className="block text-gray-300 text-sm font-bold uppercase tracking-[0.2em] mb-4">
                                    {stat.label}
                                </span>
                                <div className="text-orange-500 text-5xl md:text-6xl font-black mb-4 flex justify-center items-center">
                                    <AnimatedCounter end={stat.target} shouldStart={isVisible} />
                                    <span>+</span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium tracking-wide">
                                    {stat.subtext}
                                </span>

                                {/* Card Accent Decoration */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-tr-2xl blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsCTA;