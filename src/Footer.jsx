import React from 'react';
import { Facebook, Instagram, Youtube, Send, Phone, MapPin, Mail, Play } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full bg-[#f8f9fa] pt-16">
            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
                    {/* Column 1: About us */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-[#4a0b59]">About us</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            EduCat is committed to providing world-class education through innovative digital platforms.
                            Our mission is to empower students with knowledge and skills that transcend boundaries.
                        </p>
                        <div className="flex space-x-4 mt-4">
                            <a href="#" className="p-2 bg-white rounded-full shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-full shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-full shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300">
                                <Youtube size={18} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-full shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300">
                                <Send size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Contact Us */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-[#4a0b59]">Contact Us</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-gray-600 text-sm">
                                <span className="p-1.5 bg-orange-100 rounded text-[#ed8936]">
                                    <Phone size={14} fill="currentColor" />
                                </span>
                                <span>0714783615</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 text-sm">
                                <span className="p-1.5 bg-orange-100 rounded text-[#ed8936]">
                                    <MapPin size={14} fill="currentColor" />
                                </span>
                                <span>EduCat</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 text-sm">
                                <span className="p-1.5 bg-orange-100 rounded text-[#ed8936]">
                                    <Mail size={14} fill="currentColor" />
                                </span>
                                <span>info@EduCat.lk</span>
                            </div>

                            {/* Repositioned Links */}
                            <div className="flex flex-col gap-2 mt-4">
                                <a href="#" className="text-[#4a0b59] text-sm font-semibold hover:text-[#ed8936] transition-colors">Register Now</a>
                                <a href="#" className="text-[#4a0b59] text-sm font-semibold hover:text-[#ed8936] transition-colors">Login</a>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Video Placeholder */}
                    <div className="w-full h-full">
                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg group cursor-pointer w-full min-h-[200px]">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <Play size={28} fill="currentColor" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-xs font-medium">Watch Intro Video</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="w-full bg-[#4a0b59] py-4">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-white text-[10px] md:text-xs opacity-80 uppercase tracking-widest">
                        Copyright © 2023 EduCat By Fyrex | All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
