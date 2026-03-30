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
    cb(null, path.join(process.cwd(), 'uploads', 'verification'));
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
  try {
    const { userId } = req.params;

    const nicFile = req.files?.nic ? req.files.nic[0].filename : null;
    const cvFile = req.files?.cv ? req.files.cv[0].filename : null;

    // STEP 1: Check if teacher exists
    const checkSql = "SELECT * FROM teachers WHERE user_id = ?";

    db.query(checkSql, [userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.length === 0) {
        if (!nicFile || !cvFile) {
          return res.status(400).json({ error: "Both NIC and CV are required for first-time submission" });
        }
        // ✅ INSERT (FIRST TIME)
        const insertSql = `
          INSERT INTO teachers 
          (user_id, resume_link, nic_path, verification_status)
          VALUES (?, ?, ?, 'submitted')
        `;

        db.query(insertSql, [userId, cvFile, nicFile], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({ message: "Documents submitted successfully." });
        });

      } else {
        // ✅ UPDATE (IF EXISTS)
        let updateSql = "UPDATE teachers SET verification_status = 'submitted'";
        const queryParams = [];

        if (cvFile) {
          updateSql += ", resume_link = ?";
          queryParams.push(cvFile);
        }
        if (nicFile) {
          updateSql += ", nic_path = ?";
          queryParams.push(nicFile);
        }

        updateSql += " WHERE user_id = ?";
        queryParams.push(userId);

        db.query(updateSql, queryParams, (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({ message: "Documents updated successfully." });
        });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
// 3. Get Notifications endpoint for retrieving admin messages
router.get('/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
  
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: results });
  });
});

// 4. Get Teacher Status for retrieving submitted documents
router.get('/teacher-status/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = "SELECT resume_link, nic_path, verification_status FROM teachers WHERE user_id = ?";
  
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      res.json({ success: true, data: results[0] });
    } else {
      res.json({ success: true, data: null });
    }
  });
});

export default router;