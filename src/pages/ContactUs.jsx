import React, { useState } from 'react';
import { Phone, Mail, MapPin, User, MessageSquare, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

const ContactUs = ({ userRole, userName, onLogout }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Phone validation
    const phoneRegex = /^\+94\d{9}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone number must be in the format +94777777777";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3000/api/contact', formData, {
        withCredentials: true
      });
      if (response.data.success) {
        alert("Your message has been sent successfully!");
        setFormData({ name: '', phone: '', email: '', message: '' });
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert(error.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-32 pb-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4a0b59] to-indigo-600 mb-4 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We'd love to hear from you! Whether you have a question about classes, pricing, or technical support, our team is ready to answer all your questions.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden border border-gray-100 flex flex-col md:flex-row">

          {/* Left Column: Form */}
          <div className="w-full md:w-3/5 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4a0b59] transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4a0b59]/20 focus:border-[#4a0b59] transition-all outline-none text-gray-800"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4a0b59] transition-colors">
                  <Phone size={20} />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number (+94777777777)"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border rounded-xl focus:ring-2 focus:ring-[#4a0b59]/20 transition-all outline-none text-gray-800 ${errors.phone ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#4a0b59]'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.phone}</p>}
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4a0b59] transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border rounded-xl focus:ring-2 focus:ring-[#4a0b59]/20 transition-all outline-none text-gray-800 ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#4a0b59]'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email}</p>}
              </div>

              <div className="relative group">
                <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-gray-400 group-focus-within:text-[#4a0b59] transition-colors">
                  <MessageSquare size={20} />
                </div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows="4"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4a0b59]/20 focus:border-[#4a0b59] transition-all outline-none resize-y text-gray-800"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#4a0b59] to-[#781896] text-white py-4 rounded-xl transition-all duration-300 shadow-lg shadow-[#4a0b59]/30 font-semibold text-lg ${isSubmitting
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:from-[#3a0846] hover:to-[#5a156b] hover:-translate-y-1 active:translate-y-0'
                  }`}
              >
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>

          {/* Right Column: Contact Information */}
          <div className="w-full md:w-2/5 bg-gradient-to-br from-[#1b1c3b] to-[#3b174d] p-8 md:p-12 text-white relative overflow-hidden flex flex-col justify-center">
            {/* Decorative circles */}
            <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl"></div>

            <div className="relative z-10 h-full flex flex-col">
              <h2 className="text-3xl font-bold mb-10 text-white">Contact Info</h2>

              <div className="space-y-10 flex-grow">
                {/* Phone Numbers */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-indigo-300/80 mb-5">Phone Support</h3>
                  <div className="space-y-5">
                    <div className="flex items-start group cursor-default">
                      <div className="bg-white/10 p-3 rounded-xl mr-5 text-indigo-300 group-hover:bg-[#ed8936]/20 group-hover:text-[#ed8936] transition-all duration-300 shadow-sm border border-white/5">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm tracking-wide">General Hotline</p>
                        <p className="text-indigo-200/80 text-sm mt-1">+94 769 252 400</p>
                      </div>
                    </div>
                    <div className="flex items-start group cursor-default">
                      <div className="bg-white/10 p-3 rounded-xl mr-5 text-indigo-300 group-hover:bg-[#ed8936]/20 group-hover:text-[#ed8936] transition-all duration-300 shadow-sm border border-white/5">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm tracking-wide">Classes & Payments</p>
                        <p className="text-indigo-200/80 text-sm mt-1">+94 714 783 615</p>
                      </div>
                    </div>
                    <div className="flex items-start group cursor-default">
                      <div className="bg-white/10 p-3 rounded-xl mr-5 text-indigo-300 group-hover:bg-[#ed8936]/20 group-hover:text-[#ed8936] transition-all duration-300 shadow-sm border border-white/5">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm tracking-wide">Technical Support</p>
                        <p className="text-indigo-200/80 text-sm mt-1">+94 767 722 522</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-indigo-300/80 mb-5">Email Us</h3>
                  <div className="flex items-center group cursor-default">
                    <div className="bg-white/10 p-3 rounded-xl mr-5 text-indigo-300 group-hover:bg-[#ed8936]/20 group-hover:text-[#ed8936] transition-all duration-300 shadow-sm border border-white/5">
                      <Mail size={20} />
                    </div>
                    <p className="text-indigo-200/80 text-sm font-medium tracking-wide">info@EduCat.lk</p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-indigo-300/80 mb-5">Visit Us</h3>
                  <div className="flex items-start group cursor-default">
                    <div className="bg-white/10 p-3 rounded-xl mr-5 text-indigo-300 group-hover:bg-[#ed8936]/20 group-hover:text-[#ed8936] transition-all duration-300 shadow-sm border border-white/5 shrink-0">
                      <MapPin size={20} />
                    </div>
                    <p className="text-indigo-200/80 text-sm leading-relaxed pt-1">
                      Educat,<br />
                      Kurunegala Road,<br />
                      Anamaduwa.

                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
