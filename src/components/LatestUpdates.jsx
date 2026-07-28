import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2 } from 'lucide-react';

const LatestUpdates = () => {
    const [advertisements, setAdvertisements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    // Fallback if no ads
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-20 w-full col-span-full">
                    <Loader2 className="w-10 h-10 text-[#4a0b59] animate-spin" />
                </div>
            );
        }

        if (advertisements.length === 0) {
            // Keep the default static banners if no dynamic ones exist yet
            return (
                <>
                    <div className="relative group overflow-hidden rounded-xl shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer bg-white">
                        <img src="/add4.png" alt="Apply Now" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative group overflow-hidden rounded-xl shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer bg-white">
                        <img src="/add3.png" alt="Our Team" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-gray-100 rounded-xl shadow-md flex justify-center items-center p-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
                        <img src="/add1.png" alt="Flyer 1" className="w-full h-auto max-h-[500px] object-contain" />
                    </div>
                    <div className="bg-gray-100 rounded-xl shadow-md flex justify-center items-center p-4 transition-transform duration-300 hover:scale-105 cursor-pointer">
                        <img src="/add2.png" alt="Flyer 2" className="w-full h-auto max-h-[500px] object-contain" />
                    </div>
                </>
            );
        }

        return advertisements.map((ad) => (
            <div key={ad.ad_id} className="relative group overflow-hidden rounded-xl shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer bg-white aspect-[4/3] md:aspect-[3/2] flex justify-center items-center p-4">
                <img
                    src={ad.ad_link}
                    alt={`Advertisement from ${ad.teacher_name}`}
                    className="w-full h-auto max-h-[500px] object-contain"
                    title={`By ${ad.teacher_name} (Rating: ${Number(ad.avg_rating).toFixed(1)}/5.0)`}
                />
            </div>
        ));
    };

    return (
        <section className="w-full bg-[#f9f8f4] py-16">
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

                {/* Banners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-6 mt-10">
                    {renderContent()}
                </div>
            </div>
        </section>
    );
};

export default LatestUpdates;
