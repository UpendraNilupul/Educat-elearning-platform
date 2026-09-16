import nodemailer from 'nodemailer';
import net from 'net';
import dns from 'dns';
import dotenv from 'dotenv';

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

// Create a transporter using SMTP (e.g., Gmail)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    createConnection: (options, callback) => net.connect({ host: options.host, port: options.port, family: 4 }, callback),
    auth: {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
    },
    tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false,
    },
});

export const sendContactEmail = async ({ name, email, phone, message }) => {
    const recipient = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
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
    };

    return await transporter.sendMail(mailOptions);
};

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
