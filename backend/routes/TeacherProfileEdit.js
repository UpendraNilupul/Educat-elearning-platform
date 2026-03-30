import express from 'express';
import db from '../db.js'; // MySQL connection
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 🌟 THE NEW TEAMMATE: ENHANCED DIRECTORY LOGIC
const verificationUploadDir = path.join(process.cwd(), 'uploads', 'verification');

// Ensure the folder exists to prevent crashes
if (!fs.existsSync(verificationUploadDir)) {
  fs.mkdirSync(verificationUploadDir, { recursive: true });
}

// Configure multer for image uploads (Now going to uploads/verification/)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, verificationUploadDir);
  },
  filename: function (req, file, cb) {
    // userId is in req.params.id for this PUT route
    cb(null, `profile-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

// ==========================
// GET teacher info (current data)
// ==========================
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT u.id, u.name, u.email, u.phone_number, u.address, DATE_FORMAT(u.dob, '%Y-%m-%d') as dob, u.gender, u.picture, u.\`2fa_enabled\`,
           t.highest_qualification, t.university, t.experience_years, t.bio
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN teachers t ON u.id = t.user_id
    WHERE u.id = ? AND r.role_name = 'teacher'
  `;

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: 'Teacher not found' });
    res.json(result[0]);
  });
});

// ==========================
// UPDATE teacher info with validation
// ==========================
router.put('/:id', upload.single('picture'), (req, res) => {
  const id = req.params.id;
  
  // Security check: ensure only logged in user can edit their profile
  if (req.session && req.session.userId && req.session.userId !== parseInt(id)) {
    return res.status(403).json({ error: 'Unauthorized to edit this profile' });
  }

  const { name, email, phone_number, address, dob, gender, highest_qualification, university, experience_years, bio } = req.body;
  const twoFactorEnabled = req.body['2fa_enabled'] === 'true' || req.body['2fa_enabled'] === true ? 1 : 0;

  // -------------------------
  // Validation
  // -------------------------
  if (!name || !email) return res.status(400).json({ error: 'Name and Email are required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  if (phone_number && phone_number.trim() !== '' && !/^\+?[0-9\-\s()]{9,15}$/.test(phone_number)) {
    return res.status(400).json({ error: 'Phone number must be a valid format between 9 and 15 characters' });
  }

  if (dob && new Date(dob) >= new Date('2018-01-01')) {
    return res.status(400).json({ error: 'Date of birth must be before 2018-01-01' });
  }

  // -------------------------
  // Build query
  // -------------------------
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Failed to get connection from pool:", err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: 'Transaction failed' });
      }

      // 1. UPDATE Users table
      // We avoid sending 'null' to columns that are NOT NULL in the database
      let userQuery = `UPDATE users SET name = ?, email = ?, phone_number = ?, address = ?, dob = ?, gender = ?, \`2fa_enabled\` = ?`;
      const userParams = [
        name, 
        email, 
        phone_number || "", 
        address || "", 
        dob || "1990-01-01", 
        gender || "other", 
        twoFactorEnabled
      ];

      if (req.file) {
        userQuery += ', picture = ?';
        userParams.push(req.file.filename);
      }

      userQuery += ' WHERE id = ?';
      userParams.push(id);

      connection.query(userQuery, userParams, (err, result) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ error: `Update Users Table failed: ${err.message}` });
          });
        }

        // 2. UPDATE Teachers table
        const teacherQuery = `
          INSERT INTO teachers (user_id, highest_qualification, university, experience_years, bio)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            highest_qualification = VALUES(highest_qualification), 
            university = VALUES(university), 
            experience_years = VALUES(experience_years), 
            bio = VALUES(bio)
        `;
        const teacherParams = [
          id,
          highest_qualification || null, 
          university || null, 
          experience_years || null, 
          bio || null
        ];

        connection.query(teacherQuery, teacherParams, (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: `Update Teachers Table failed: ${err.message}` });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: 'Failed to commit transaction' });
              });
            }
            connection.release();
            res.json({ message: 'Profile updated successfully' });
          });
        });
      });
    });
  });
});

export default router;