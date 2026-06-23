import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter using SMTP (e.g., Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
        user: process.env.EMAIL_USER, // e.g., 'your-email@gmail.com'
        pass: process.env.EMAIL_PASS, // e.g., 'your-app-password'
    },
});

export const sendEnrollmentEmail = async (toEmail, studentName, courseTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Enrollment Successful - Educat',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #6366f1;">Welcome to ${courseTitle}!</h2>
                    <p>Hi ${studentName},</p>
                    <p>Your payment was successful and you have been officially enrolled in <strong>${courseTitle}</strong>.</p>
                    <p>You can now log in to the platform and start your learning journey.</p>
                    <br/>
                    <p>Happy Learning!</p>
                    <p><strong>Educat Team</strong></p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Enrollment email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
