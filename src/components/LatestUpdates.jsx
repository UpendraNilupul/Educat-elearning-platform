import React from 'react';

const LatestUpdates = () => {
    return (
        <section className="w-full bg-[#f9f8f4] py-16">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#4a0b59] mb-4">
                        Latest Updates
                    </h2>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto">
                        Stay informed with the latest news, announcements, and upcoming events from our campus.
                    </p>
                </div>

                {/* Banners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-6 mt-10">
                    {/* Top Row: Existing Banners */}
                    <div className="relative group overflow-hidden rounded-xl shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer bg-white">
                        <img
                            src="/add4.png"
                            alt="Apply Now"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative group overflow-hidden rounded-xl shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer bg-white">
                        <img
                            src="/add3.png"
                            alt="Our Team"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Bottom Row: New Flyers */}
                    <div className="bg-gray-100 rounded-xl shadow-md flex justify-center items-center p-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
                        <img
                            src="/add1.png"
                            alt="Flyer 1"
                            className="w-full h-auto max-h-[500px] object-contain"
                        />
                    </div>
                    <div className="bg-gray-100 rounded-xl shadow-md flex justify-center items-center p-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
                        <img
                            src="/add2.png"
                            alt="Flyer 2"
                            className="w-full h-auto max-h-[500px] object-contain"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LatestUpdates;
