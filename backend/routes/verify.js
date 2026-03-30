import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

// 1. Configure storage to save in uploads/verification/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'verification')); 
  },
  filename: (req, file, cb) => {
    // Format: userId-fieldname-timestamp.extension
    cb(null, `${req.params.userId}-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// 2. Multi-file upload endpoint
router.post('/upload-docs/:userId', upload.fields([
  { name: 'nic', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), (req, res) => {
  const { userId } = req.params;
  
  const nicFile = req.files['nic'][0].filename;
  const cvFile = req.files['cv'][0].filename;

  // Update Teacher table with links and set status to 'submitted'
  const sql = `
    UPDATE teachers 
    SET resume_link = ?, nic_path = ?, verification_status = 'pending' 
    WHERE user_id = ?`;

  db.query(sql, [cvFile, nicFile, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Documents uploaded successfully." });
  });
});

export default router;