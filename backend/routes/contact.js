import express from 'express';
import { sendContactEmail } from '../emailService.js';

const router = express.Router();

router.post('/contact', async (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  try {
    const result = await sendContactEmail({ name, email, phone, message });
    return res.status(200).json({ success: true, message: 'Message sent successfully!', data: result });
  } catch (error) {
    console.error("Contact route email error:", error);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

export default router;
