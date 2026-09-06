import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqData = [
    { question: "How do I enroll in a class?", answer: "To enroll, simply create a student account, browse our available classes on the 'Classes' page, and click the 'Enroll' button. Once your payment is processed, you will get instant access to the course materials." },
    { question: "What payment methods are accepted?", answer: "We accept all major credit and debit cards (Visa, Mastercard, AMEX), as well as secure online bank transfers. All payments are processed through our encrypted payment gateway." },
    { question: "Can I access the classes on my mobile device?", answer: "Absolutely! The EduCat platform is fully responsive, meaning you can watch video lessons, read PDFs, and submit assignments directly from your smartphone or tablet." },
    { question: "Are the live classes recorded?", answer: "Yes. If you miss a live Zoom or Google Meet class, the recording will be uploaded to your student portal within 24 hours so you can catch up at your own pace." },
    { question: "How do I contact my teacher?", answer: "You can communicate with your teacher directly through the Student Portal using the Direct Messaging system, or by replying to Class Announcements." },
    { question: "What is the refund policy?", answer: "We offer a 7-day money-back guarantee for all courses. If you are not satisfied with the class content within the first week, contact our support team for a full refund." },
    { question: "How do I reset my password?", answer: "Click the 'Forgot Password' link on the login page. Enter your registered email address, and we will send you a secure link to create a new password." },
    { question: "Are study materials and class notes provided?", answer: "Yes! Teachers regularly upload lesson materials, including PDF summary notes, presentation slides, and past papers, directly to your class modules for you to download and use for exam revision." },
    { question: "How does assignment grading work?", answer: "After you upload your assignment, your teacher will review it through their dashboard. Once graded, you will receive a real-time notification with your score and any written feedback." },
    { question: "What do I do if I experience technical issues?", answer: "If you run into any bugs or connection issues, please visit our 'Contact Us' page and send a message to our technical support team. We aim to resolve all technical issues within 24 hours." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-32 pb-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-md text-[#4a0b59]">
              <HelpCircle size={40} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4a0b59] to-indigo-600 mb-4 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to the most common questions about the EduCat platform, enrollment, and technical support.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${openIndex === index ? 'border-[#4a0b59] shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
              <button onClick={() => toggleFAQ(index)} className="w-full flex items-center justify-between p-6 text-left focus:outline-none">
                <h3 className={`font-semibold text-lg pr-8 ${openIndex === index ? 'text-[#4a0b59]' : 'text-gray-800'}`}>
                  {faq.question}
                </h3>
                <div className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'text-[#4a0b59]' : ''}`}>
                  {openIndex === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>
              <div className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-50 mt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">If you couldn't find the answer you were looking for, our team is here to help.</p>
          <a href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-[#4a0b59] hover:bg-[#3a0846] text-white font-semibold rounded-xl transition-colors shadow-md">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
