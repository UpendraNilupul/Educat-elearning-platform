import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Send, Phone, MapPin, Mail, Play } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full bg-gradient-to-b from-[#f8f9fa] to-purple-50/40 border-t border-gray-100 pt-12 pb-6">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pb-10 border-b border-gray-200/60">

                    {/* Column 1: Brand & Socials */}
                    <div className="flex flex-col items-start gap-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-black text-[#4a0b59] tracking-tight">Edu<span className="text-[#ed8936]">Cat</span></span>
                        </div>
                        <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                            Empowering students across Sri Lanka with world-class digital learning experiences.
                        </p>
                        <div className="flex space-x-3">
                            <a href="#" className="p-2 bg-white rounded-xl shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300 border border-gray-100">
                                <Facebook size={16} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-xl shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300 border border-gray-100">
                                <Instagram size={16} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-xl shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300 border border-gray-100">
                                <Youtube size={16} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-xl shadow-sm text-[#4a0b59] hover:bg-[#4a0b59] hover:text-white transition-all duration-300 border border-gray-100">
                                <Send size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Contact & Links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-bold text-[#4a0b59] uppercase tracking-wider mb-1">Quick Contact</h4>
                        <div className="flex items-center gap-2.5 text-gray-600 text-xs">
                            <span className="p-1.5 bg-orange-100/80 rounded-lg text-[#ed8936]">
                                <Phone size={13} />
                            </span>
                            <span className="font-medium">+94 769 252 400</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-600 text-xs">
                            <span className="p-1.5 bg-orange-100/80 rounded-lg text-[#ed8936]">
                                <Mail size={13} />
                            </span>
                            <span className="font-medium">info@EduCat.lk</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-gray-600 text-xs">
                            <span className="p-1.5 bg-orange-100/80 rounded-lg text-[#ed8936]">
                                <MapPin size={13} />
                            </span>
                            <span className="font-medium">Educat, Kurunegala Road, Anamaduwa</span>
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                            <Link to="/register" className="text-xs font-bold text-[#4a0b59] hover:text-[#ed8936] transition-colors">Register Now</Link>
                            <span className="text-gray-300">•</span>
                            <Link to="/login" className="text-xs font-bold text-[#4a0b59] hover:text-[#ed8936] transition-colors">Login Portal</Link>
                            <span className="text-gray-300">•</span>
                            <Link to="/faq" className="text-xs font-bold text-[#4a0b59] hover:text-[#ed8936] transition-colors">FAQ</Link>
                        </div>
                    </div>

                    {/* Column 3: Compact Video Preview */}
                    <div className="w-full flex justify-end">
                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-md group cursor-pointer w-full max-w-[260px] border border-gray-200">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-[11px] font-medium">Watch Intro Video</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Copyright Bar */}
                <div className="w-full text-center pt-6">
                    <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest font-medium">
                        Copyright © 2026 EduCat By Fyrex | All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
