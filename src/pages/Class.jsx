import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Class = () => {
    const { classId } = useParams();
    const [classData, setClassData] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. Class eke details saha lamaya enrollment eka check kirima
    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/student/class-details/${classId}`, { withCredentials: true });
                setClassData(response.data.class);
                setIsEnrolled(response.data.isEnrolled);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching class details:", error);
                setLoading(false);
            }
        };
        fetchClassDetails();
    }, [classId]);

    // 2. Payment ekata Hash eka generate kirima saha PayHere start kirima
    const handlePayment = async (cId, moduleId, amount) => {
        try {
            const userId = localStorage.getItem('userId') || 2; // Udaharanayakata userId eka gannawa
            const orderId = `${cId}_${moduleId}_${userId}_${Date.now()}`;
            const currency = "LKR";
            const formattedAmount = parseFloat(amount).toFixed(2);

            // Backend eken hash eka gannawa
            const hashResponse = await fetch('http://localhost:3000/api/payment/generate-hash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, amount: formattedAmount, currency: currency })
            });

            const hashData = await hashResponse.json();

            // PayHere object eka hadagannawa
            const payment = {
                "sandbox": true,
                "merchant_id": "1234834",
                "return_url": "http://localhost:5173/student",
                "cancel_url": "http://localhost:5173/student",
                // 🚨 OYAGE DAN WADA KARANA NGROK LINK EKA METHANATA DANNA
                "notify_url": "https://shanae-unfetching-luisa.ngrok-free.dev/api/payment/notify", 
                "order_id": orderId,
                "items": `Tuition Fee for Class ${cId}`,
                "amount": formattedAmount,
                "currency": currency,
                "hash": hashData.hash,
                "first_name": "Educat",
                "last_name": "Student",
                "email": "student@educat.com",
                "phone": "0771234567",
                "address": "Educat elearning",
                "city": "Colombo",
            };

            // 3. Payment eka iwara wuna gaman wena de (Auto Reload)
            window.payhere.onCompleted = function onCompleted(orderId) {
                console.log("Payment completed. OrderID:" + orderId);
                alert("Payment Successful! Your class is now being unlocked.");
                // 🌟 Meken thama page eka reload wela class eka unlock wela pennanne
                window.location.reload(); 
            };

            window.payhere.onDismissed = function onDismissed() {
                console.log("Payment window closed.");
            };

            window.payhere.onError = function onError(error) {
                console.log("Payment Error:" + error);
            };

            // PayHere popup eka on karanawa
            window.payhere.startPayment(payment);

        } catch (error) {
            console.error("Payment initiation failed:", error);
            alert("Something went wrong with the payment gateway.");
        }
    };

    if (loading) return <div>Loading class details...</div>;
    if (!classData) return <div>Class not found!</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">{classData.course_name}</h1>
            <p className="mt-2 text-gray-600">{classData.description}</p>
            
            <div className="mt-8 p-4 border rounded-lg bg-gray-50 text-center">
                <h3 className="text-xl font-semibold">Course Fee: LKR {classData.price}</h3>
                
                {isEnrolled ? (
                    <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg font-bold">
                        ENTER PORTAL
                    </button>
                ) : (
                    <button 
                        onClick={() => handlePayment(classData.c_id, classData.m_id, classData.price)}
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600"
                    >
                        PAY & ENROLL NOW
                    </button>
                )}
            </div>
        </div>
    );
};

export default Class;