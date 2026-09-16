import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const LatestUpdates = () => {
    const [advertisements, setAdvertisements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const response = await api.get('/public/advertisements/top');
                setAdvertisements(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Failed to fetch advertisements", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAds();
    }, []);

    // Optional: Auto-slide every 5 seconds
    useEffect(() => {
        if (isLoading) return;
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, isLoading, advertisements]);

    // Fallback static ads if the database is empty
    const fallbackAds = [
        { ad_id: 'f1', ad_link: '/add4.png', teacher_name: 'EduCat Team', avg_rating: 5.0 },
        { ad_id: 'f2', ad_link: '/add3.png', teacher_name: 'EduCat Team', avg_rating: 5.0 },
        { ad_id: 'f3', ad_link: '/add1.png', teacher_name: 'EduCat Team', avg_rating: 5.0 },
        { ad_id: 'f4', ad_link: '/add2.png', teacher_name: 'EduCat Team', avg_rating: 5.0 }
    ];

    const displayAds = advertisements.length > 0 ? advertisements : fallbackAds;

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === displayAds.length - 1 ? 0 : prevIndex + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? displayAds.length - 1 : prevIndex - 1));
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    return (
        <section id="classes" className="w-full bg-[#f9f8f4] py-16 scroll-mt-24">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#4a0b59] mb-4">
                        Latest Updates & Featured Teachers
                    </h2>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto">
                        Stay informed with the latest announcements, events, and promotions from our top-rated educators.
                    </p>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-20 w-full">
                        <Loader2 className="w-10 h-10 text-[#4a0b59] animate-spin" />
                    </div>
                ) : (
                    /* Carousel Container */
                    <div className="relative w-full max-w-5xl mx-auto group">
                        
                        {/* Main Image Viewport (Updated for better height scaling) */}
                        <div className="overflow-hidden rounded-2xl shadow-lg bg-white relative h-[400px] md:h-[500px] lg:h-[600px] w-full flex justify-center items-center">
                            <img
                                src={displayAds[currentIndex].ad_link}
                                alt={`Advertisement from ${displayAds[currentIndex].teacher_name}`}
                                className="w-full h-full object-contain p-2 md:p-4 transition-all duration-500 ease-in-out"
                                title={`By ${displayAds[currentIndex].teacher_name} (Rating: ${Number(displayAds[currentIndex].avg_rating).toFixed(1)}/5.0)`}
                            />
                        </div>

                        {/* Left Navigation Arrow */}
                        <button 
                            onClick={prevSlide}
                            className="absolute top-1/2 -left-4 md:-left-6 -translate-y-1/2 bg-white/80 hover:bg-[#4a0b59] text-[#4a0b59] hover:text-white p-2 md:p-3 rounded-full shadow-md backdrop-blur-sm transition-all z-10"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* Right Navigation Arrow */}
                        <button 
                            onClick={nextSlide}
                            className="absolute top-1/2 -right-4 md:-right-6 -translate-y-1/2 bg-white/80 hover:bg-[#4a0b59] text-[#4a0b59] hover:text-white p-2 md:p-3 rounded-full shadow-md backdrop-blur-sm transition-all z-10"
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Navigation Dots */}
                        <div className="flex justify-center gap-2 mt-6">
                            {displayAds.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        currentIndex === index 
                                            ? 'bg-[#4a0b59] w-8' 
                                            : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default LatestUpdates;
