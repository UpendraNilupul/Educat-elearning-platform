import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend with RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

/**
 * Sends contact inquiry email directly to the platform admin.
 */
export const sendContactEmail = async ({ name, email, phone, message }) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured in environment variables.');
        throw new Error('RESEND_API_KEY is missing. Please set it in your environment.');
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'delivered@resend.dev';
    const fromSender = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
        from: fromSender,
        to: [adminEmail],
        replyTo: email,
        subject: `New Inquiry from ${name} - Educat`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
                <h2 style="color: #4a0b59; border-bottom: 2px solid #4a0b59; padding-bottom: 8px;">New Contact Inquiry</h2>
                <p>You have received a new inquiry from the Educat platform contact form.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; width: 120px; background-color: #f9fafb;">Name</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Email</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Phone</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb;">${phone || 'Not provided'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb; vertical-align: top;">Message</td>
                        <td style="padding: 10px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${message}</td>
                    </tr>
                </table>
                <br/>
                <p style="font-size: 12px; color: #6b7280;">This message was submitted via the Educat contact form.</p>
            </div>
        `,
    });

    if (error) {
        console.error('Resend sendContactEmail API Error:', error);
        throw new Error(error.message || 'Failed to send contact email');
    }

    return data;
};

/**
 * Sends enrollment confirmation directly to the enrolled student.
 */
export const sendEnrollmentEmail = async (toEmail, studentName, courseTitle) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not configured in environment variables.');
            return false;
        }

        const fromSender = process.env.EMAIL_FROM || 'onboarding@resend.dev';

        const { data, error } = await resend.emails.send({
            from: fromSender,
            to: [toEmail],
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
        });

        if (error) {
            console.error('Resend sendEnrollmentEmail API Error:', error);
            return false;
        }

        console.log('Enrollment email sent successfully:', data?.id);
        return true;
    } catch (error) {
        console.error('Error sending enrollment email:', error);
        return false;
    }
};

/**
 * Sends password reset OTP directly to the user requesting it.
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not configured in environment variables.');
            return false;
        }

        const fromSender = process.env.EMAIL_FROM || 'onboarding@resend.dev';

        const { data, error } = await resend.emails.send({
            from: fromSender,
            to: [toEmail],
            subject: 'Educat Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #4a0b59; text-align: center; margin-bottom: 20px;">Educat Password Reset</h2>
                    <p>Hello,</p>
                    <p>You requested a one-time password (OTP) to reset your Educat account password (${toEmail}).</p>
                    <div style="text-align: center; margin: 28px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4a0b59; background-color: #f3e8ff; padding: 12px 28px; border-radius: 8px; border: 1px dashed #a855f7;">
                            ${otpCode}
                        </span>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. If you did not request this, please safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">Educat E-Learning Platform</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend sendOtpEmail API Error:', error);
            return false;
        }

        console.log(`OTP email sent successfully to ${toEmail}:`, data?.id);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
};
