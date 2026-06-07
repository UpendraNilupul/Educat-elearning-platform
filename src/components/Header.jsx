import React, { useState, useEffect } from 'react';
import { Phone, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// 🌟 Added userName to the props
const Header = ({ userRole, userName, onLogout }) => { 
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

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

    const goToDashboard = () => {
        if (userRole === 'admin') navigate('/admin');
        else if (userRole === 'teacher') navigate('/teacher');
        else if (userRole === 'student') navigate('/student');
    };

    const navLinks = [
        { name: 'Home', path: '/', active: true },
        { name: 'Classes', path: '/#classes', active: false },
        { name: 'Teachers', path: '/teachers', active: false },
        { name: 'About', path: '/#about', active: false },
        { name: 'News', path: '/#news', active: false },
        { name: 'Contact us', path: '/#contact', active: false },
    ];

    return (
        <header className="relative w-full font-sans">
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
                        
                        {userRole ? (
                            <>
                                {/* 🌟 Changed 'Dashboard' to the user's name! */}
                                <button onClick={goToDashboard} className="transition-colors hover:text-[#ed8936]">
                                    {userName ? `Hi, ${userName}` : 'Dashboard'}
                                </button>
                                <span className="opacity-30">|</span>
                                <button onClick={onLogout} className="transition-colors hover:text-red-400">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="transition-colors hover:text-gray-300">Login</Link>
                                <span className="opacity-30">|</span>
                                <Link to="/register" className="transition-colors hover:text-gray-300">Register</Link>
                            </>
                        )}
                        
                    </div>
                </div>
            </div>

            <div className={`${isScrolled ? 'h-0' : 'h-[20px]'}`}></div>
            <nav
                className={`fixed left-0 w-full bg-white z-50 transition-all duration-300 ease-in-out ${isScrolled
                    ? 'top-0 py-2 shadow-md'
                    : 'top-auto py-4 shadow-none border-b border-gray-100'
                    }`}
            >
                <div className="flex items-center justify-between w-full px-6 mx-auto max-w-7xl">
                    <div className="flex items-center flex-shrink-0">
                        <Link to="/">
                            <img
                                src="/EduCat Logo.PNG"
                                alt="Logo"
                                className={`transition-all duration-300 object-contain w-auto ${isScrolled ? 'h-14' : 'h-20'
                                    }`}
                            />
                        </Link>
                    </div>

                    <div className="items-center hidden gap-8 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-base font-semibold transition-colors hover:text-[#ed8936] ${link.active ? 'text-[#ed8936]' : 'text-[#4a0b59]'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-[#4a0b59] p-2"
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="absolute left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg top-full md:hidden">
                        <div className="flex flex-col p-4 space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-lg font-medium py-2 border-b border-gray-50 last:border-0 ${link.active ? 'text-[#ed8936]' : 'text-[#4a0b59]'
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;