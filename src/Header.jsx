import React, { useState, useEffect } from 'react';
import { Phone, Menu, X } from 'lucide-react';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const navLinks = [
        { name: 'Home', active: true },
        { name: 'Classes', active: false },
        { name: 'Teachers', active: false },
        { name: 'About', active: false },
        { name: 'News', active: false },
        { name: 'Contact us', active: false },
    ];

    return (
        <header className="relative w-full font-sans">
            {/* Top Bar - Collapses on scroll */}
            <div
                className={`bg-[#4a0b59] text-white transition-all duration-300 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-16 py-2 opacity-100'
                    }`}
            >
                <div className="flex items-center justify-between w-full h-full px-6 mx-auto max-w-7xl">
                    <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-white" />
                        <span className="text-[#ed8936] font-semibold text-xs md:text-sm tracking-wide">0714783615</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-medium md:text-sm">
                        <button className="transition-colors hover:text-gray-300">Login</button>
                        <span className="opacity-30">|</span>
                        <button className="transition-colors hover:text-gray-300">Register</button>
                    </div>
                </div>
            </div>

            {/* Main Navigation Bar - Sticky/Fixed */}
            <div className={`${isScrolled ? 'h-0' : 'h-[20px]'}`}></div> {/* Dynamic Spacer adjusted for py-4 + logo */}
            <nav
                className={`fixed left-0 w-full bg-white z-50 transition-all duration-300 ease-in-out ${isScrolled
                    ? 'top-0 py-2 shadow-md'
                    : 'top-auto py-4 shadow-none border-b border-gray-100'
                    }`}
            >
                <div className="flex items-center justify-between w-full px-6 mx-auto max-w-7xl">
                    {/* Logo Section */}
                    <div className="flex items-center flex-shrink-0">
                        <img
                            src="/EduCat Logo.PNG"
                            alt="Logo"
                            className={`transition-all duration-300 object-contain w-auto ${isScrolled ? 'h-14' : 'h-20'
                                }`}
                        />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="items-center hidden gap-8 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={`#${link.name.toLowerCase().replace(' ', '-')}`}
                                className={`text-base font-semibold transition-colors hover:text-[#ed8936] ${link.active ? 'text-[#ed8936]' : 'text-[#4a0b59]'
                                    }`}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-[#4a0b59] p-2"
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <div className="absolute left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg top-full md:hidden">
                        <div className="flex flex-col p-4 space-y-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={`#${link.name.toLowerCase().replace(' ', '-')}`}
                                    className={`text-lg font-medium py-2 border-b border-gray-50 last:border-0 ${link.active ? 'text-[#ed8936]' : 'text-[#4a0b59]'
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
