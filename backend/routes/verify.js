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
  const sql = `
    SELECT 
      n.id, 
      n.title, 
      n.description, 
      n.user_id, 
      n.is_read, 
      n.created_at,
      m.id AS message_id,
      m.body AS message_body,
      m.file_url,
      m.file_type,
      tr.feedback AS review_feedback,
      tr.status AS review_status
    FROM notifications n
    -- 1. Try to find if this notification corresponds to a direct message from admin in conversations
    LEFT JOIN (
      SELECT m_inner.id, m_inner.body, m_inner.file_url, m_inner.file_type, m_inner.created_at, c.participant1_id, c.participant2_id
      FROM messages m_inner
      JOIN conversations c ON m_inner.conversation_id = c.id
      WHERE (c.participant1_id = ? OR c.participant2_id = ?)
    ) m ON (
      -- Match on user being in conversation and closest message sent around the notification time
      (m.participant1_id = n.user_id OR m.participant2_id = n.user_id)
      AND ABS(TIMESTAMPDIFF(SECOND, m.created_at, n.created_at)) <= 15
    )
    -- 2. Try to find if this notification corresponds to a teacher_review feedback
    LEFT JOIN teachers t ON t.user_id = n.user_id
    LEFT JOIN teacher_reviews tr ON tr.teacher_id = t.id AND ABS(TIMESTAMPDIFF(SECOND, tr.created_at, n.created_at)) <= 30
    WHERE n.user_id = ? 
    GROUP BY n.id
    ORDER BY n.created_at DESC
  `;
  
  db.query(sql, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error("Notifications fetch error, falling back to simple query:", err);
      // Fallback to simple query if joins fail
      const fallbackSql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
      db.query(fallbackSql, [userId], (fbErr, fbResults) => {
        if (fbErr) return res.status(500).json({ error: fbErr.message });
        return res.json({ success: true, data: fbResults });
      });
      return;
    }

    // Map each notification item so message/content/body are guaranteed to contain the real message
    const formatted = results.map(row => {
      // Priority for the actual text content:
      // 1. Direct message body from messages table if available
      // 2. Feedback from teacher_reviews table if available
      // 3. Description from notifications table
      let realText = row.message_body || row.review_feedback;

      // If description is NOT just "New message from Someone", description might already have the message!
      if (!realText && row.description) {
        realText = row.description;
      }

      return {
        id: row.id,
        title: row.title || 'New Message',
        description: row.description,
        content: realText || row.description,
        message: realText || row.description,
        text: realText || row.description,
        body: realText || row.description,
        file_url: row.file_url || null,
        file_type: row.file_type || null,
        user_id: row.user_id,
        is_read: row.is_read,
        created_at: row.created_at
      };
    });

    res.json({ success: true, data: formatted });
  });
});

// 3.5 Get actual chat messages for teacher from admin conversations (bypasses stale notifications table)
router.get('/teacher-messages/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT 
      m.id,
      m.body        AS description,
      m.body        AS message,
      m.body        AS content,
      m.body        AS text,
      m.body        AS body,
      m.created_at,
      m.file_url,
      m.file_type,
      u.name        AS sender_name,
      CONCAT('Message from ', u.name) AS title,
      0             AS is_read
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN users u ON m.sender_id = u.id
    WHERE (c.participant1_id = ? OR c.participant2_id = ?)
      AND m.sender_id != ?
    ORDER BY m.created_at DESC
    LIMIT 30
  `;
  db.query(sql, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('teacher-messages fetch error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// 3.6 Mark All Notifications as read
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