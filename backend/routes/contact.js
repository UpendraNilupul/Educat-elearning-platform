import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/contact', async (req, res) => {
  const { name, phone, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 1. Email to the Support Team
    const supportMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'adheeshakulasekara@gmail.com',
      replyTo: email,
      subject: `Action Required: New Support Request from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; color: #333;">
          <h2 style="color: #4a0b59; border-bottom: 2px solid #4a0b59; padding-bottom: 8px;">New Support Request</h2>
          <p>A new message has been received from the EduCat website contact form.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; width: 120px; background-color: #f9fafb;">Name</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Phone</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb;">Email</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #f9fafb; vertical-align: top;">Message</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
        </div>
      `
    };

    // 2. Auto-Reply Confirmation Email to the User
    const userConfirmationOptions = {
      from: `"EduCat Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We've received your request - EduCat Support`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a0b59; margin: 0;">EduCat</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Empowering Your Learning Journey</p>
          </div>
          
          <p style="font-size: 16px;">Dear ${name},</p>
          
          <p style="font-size: 16px; line-height: 1.5;">
            Thank you for reaching out to us! This email is to confirm that we have successfully received your message. 
          </p>
          
          <p style="font-size: 16px; line-height: 1.5;">
            Our support team is reviewing your request and will get back to you as soon as possible (usually within 24-48 hours). 
          </p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4a0b59;">
            <p style="font-size: 14px; color: #6b7280; margin-top: 0; margin-bottom: 8px;"><strong>For your records, here is a copy of your message:</strong></p>
            <p style="font-size: 14px; font-style: italic; white-space: pre-wrap; margin: 0;">"${message}"</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5;">
            If you have any urgent inquiries, you can also reach our General Hotline at <strong>+94 769 252 400</strong>.
          </p>
          
          <p style="font-size: 16px; margin-top: 30px;">
            Best regards,<br>
            <strong>The EduCat Support Team</strong>
          </p>
        </div>
      `
    };

    // Send both emails simultaneously using Promise.all for faster execution
    await Promise.all([
      transporter.sendMail(supportMailOptions),
      transporter.sendMail(userConfirmationOptions)
    ]);

    res.status(200).json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Error sending contact emails:", error);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

export default router;
