import express from 'express';
import multer from 'multer';
import path from 'path';
import { verificationStorage } from '../cloudinaryConfig.js';
import db from '../db.js';
import fs from 'fs';

const router = express.Router();

const upload = multer({ storage: verificationStorage });

// 2. Multi-file upload endpoint
router.post('/upload-docs/:userId', (req, res) => {
  upload.fields([
    { name: 'nic', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.error("Multer/Cloudinary Error:", err);
      return res.status(400).json({ error: "Upload error: " + err.message });
    }

    try {
      const { userId } = req.params;
      
      if (!userId || userId === "null") {
          return res.status(400).json({ error: "Invalid User ID provided" });
      }

      const nicFile = req.files?.nic ? req.files.nic[0].path : null;
      const cvFile = req.files?.cv ? req.files.cv[0].path : null;

      console.log(`Processing upload for User ID: ${userId}`);
      console.log("NIC File Path:", nicFile);
      console.log("CV File Path:", cvFile);

      // STEP 1: Check if teacher exists
      const checkSql = "SELECT * FROM teachers WHERE user_id = ?";

      db.query(checkSql, [userId], (err, result) => {
        if (err) {
          console.error("Database Check Error:", err);
          return res.status(500).json({ error: "Database error during check: " + err.message });
        }

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
            if (err2) {
              console.error("Database Insert Error:", err2);
              return res.status(500).json({ error: "Database error during insert: " + err2.message });
            }

            console.log("Teacher verification documents inserted successfully.");
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
            if (err2) {
              console.error("Database Update Error:", err2);
              return res.status(500).json({ error: "Database error during update: " + err2.message });
            }

            console.log("Teacher verification documents updated successfully.");
            res.json({ message: "Documents updated successfully." });
          });
        }
      });

    } catch (error) {
      console.error("Unexpected Server Error:", error);
      res.status(500).json({ error: "Server error: " + error.message });
    }
  });
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

// 3.5 Mark All Notifications as read
router.put('/notifications/:userId/read', (req, res) => {
  const { userId } = req.params;
  const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0";
  
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All notifications marked read for user ${userId}. Affected: ${result.affectedRows}`);
    res.json({ success: true, message: "Notifications marked as read" });
  });
});

// 3.6 Mark Single Notification as read
router.put('/notifications/:userId/read/:notificationId', (req, res) => {
  const { userId, notificationId } = req.params;
  const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?";
  
  db.query(sql, [userId, notificationId], (err, result) => {
    if (err) {
      console.error("Error marking notification read:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Notification ${notificationId} read status updated. Affected rows: ${result.affectedRows}`);
    res.json({ success: true, message: "Notification marked as read" });
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