import React from 'react';
import { CheckCircle } from 'lucide-react';

const AboutSection = () => {
    return (
        <section id="about" className="w-full py-20 overflow-hidden bg-gray-50 scroll-mt-24">
            <div className="container px-4 mx-auto lg:px-8">
                <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
                    
                    {/* Image / Graphic Side */}
                    <div className="relative w-full lg:w-1/2 group">
                        {/* Decorative Background Blobs */}
                        <div className="absolute top-0 bg-purple-300 rounded-full -left-4 w-72 h-72 mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute top-0 bg-orange-300 rounded-full -right-4 w-72 h-72 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute bg-pink-300 rounded-full -bottom-8 left-20 w-72 h-72 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                        
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                            {/* Using a placeholder for now, ideally an actual image from the project would go here. */}
                            <img 
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                                alt="Students collaborating" 
                                className="object-cover w-full h-auto rounded-2xl"
                            />

                        </div>
                    </div>

                    {/* Text Content Side */}
                    <div className="flex flex-col w-full space-y-6 lg:w-1/2">

                        <h2 className="text-3xl md:text-5xl font-bold text-[#4a0b59] leading-tight">
                            Empowering Your <br className="hidden md:block"/> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                Educational Journey
                            </span>
                        </h2>
                        <p className="text-lg leading-relaxed text-gray-600">
                            EduCat is committed to providing world-class education through innovative digital platforms. Our mission is to empower students with knowledge and skills that transcend boundaries..
                        </p>
                        
                        <ul className="pt-4 space-y-4">
                            {[
                                'Expert instructors with real-world experience',
                                'Interactive learning modules and assessments',
                                'Flexible schedules tailored to your lifestyle',
                                'Comprehensive support and community forums'
                            ].map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle className="flex-shrink-0 mt-1 text-orange-500" size={20} />
                                    <span className="font-medium text-gray-700">{item}</span>
                                </li>
                            ))}
                        </ul>


                    </div>

                </div>
            </div>
            
            {/* Minimal inline styles for the blob animations if not configured in tailwind config */}
            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </section>
    );
};

export default AboutSection;
