import React from 'react';
import { Quote } from 'lucide-react';

const Teachers = () => {
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

    return (
        <div className="w-full min-h-screen bg-gray-50 pb-20 pt-24">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-[#4a0b59] to-[#701684] text-white py-20 px-4 md:px-8 mb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <div className="container mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                        Meet Our <span className="text-[#4ade80]">Expert Educators</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                        Dedicated professionals committed to fostering academic excellence and inspiring the next generation of thinkers.
                    </p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4ade80]/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            </section>

            {/* Content Section */}
            <section className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                    {teachers.map((teacher) => (
                        <div 
                            key={teacher.id} 
                            className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col md:flex-row gap-8 items-center group"
                        >
                            {/* Portrait */}
                            <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-500">
                                <img
                                    src={teacher.image}
                                    alt={teacher.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col flex-grow text-center md:text-left">
                                <h3 className="text-[#4ade80] text-sm md:text-base font-bold uppercase tracking-widest mb-2">
                                    {teacher.subject}
                                </h3>
                                <h4 className="text-2xl md:text-3xl font-black text-[#4a0b59] mb-4">
                                    {teacher.name}
                                </h4>
                                
                                <div className="relative">
                                    <Quote size={24} className="text-[#4a0b59]/10 absolute -top-2 -left-3" />
                                    <p className="text-gray-600 italic font-light leading-relaxed relative z-10 pl-4 border-l-2 border-[#4a0b59]/20">
                                        "{teacher.quote}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Teachers;
