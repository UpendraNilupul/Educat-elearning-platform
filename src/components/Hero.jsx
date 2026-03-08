import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

const Hero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const images = [
        '/hero_slide_1.png',
        '/hero_slide_2.png',
        '/hero_slide_3.png'
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <section className="relative w-full min-h-[500px] md:h-[600px] flex flex-col md:flex-row overflow-hidden">
            {/* Left Side: Content (Static) */}
            <div className="w-full md:w-1/2 bg-[#4a0b59] flex items-center px-8 md:px-16 py-16 md:py-0 z-10">
                <div className="max-w-xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-8">
                        Boost up your skills with a new way of learning
                    </h1>
                    <button className="flex items-center space-x-3 bg-[#ed8936] text-white px-6 py-3 rounded-full hover:bg-[#d97706] transition-all group shadow-lg">
                        <span className="text-lg font-medium">Start learning today</span>
                        <div className="bg-[#4a0b59] p-2 rounded-full flex items-center justify-center">
                            <Play size={16} fill="white" className="text-white" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Right Side: Image Slider with Crossfade */}
            <div className="w-full md:w-1/2 relative overflow-hidden bg-gray-200">
                {/* Image Containers */}
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={img}
                            alt={`Education Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}

                {/* Soft Gradient Overlay for seamless transition */}
                <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#4a0b59] to-transparent z-20 pointer-events-none" />
            </div>

            {/* Carousel Dots - Bottom Center (Dynamic) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${index === currentSlide
                            ? 'bg-white border-2 border-green-500 scale-110 shadow-md'
                            : 'bg-transparent border-2 border-gray-400 hover:border-gray-300'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default Hero;
