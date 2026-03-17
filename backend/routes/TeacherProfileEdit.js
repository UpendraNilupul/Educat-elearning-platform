import express from 'express';
import db from '../db.js'; // MySQL connection
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder to save images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==========================
// GET teacher info (current data)
// ==========================
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT u.id, u.name, u.email, u.phone_number, u.address, u.dob, u.gender, u.picture
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND r.role_name = 'teacher'
  `;

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length === 0) return res.status(404).json({ error: 'Teacher not found' });
    res.json(result[0]);
  });
});

// ==========================
// UPDATE teacher info with validation
// ==========================
router.put('/:id', upload.single('picture'), (req, res) => {
  const id = req.params.id;
  const { name, email, phone_number, address, dob, gender } = req.body;

  // -------------------------
  // Validation
  // -------------------------
  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  // Phone number: numbers only, max 10 digits
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone_number)) return res.status(400).json({ error: 'Phone number must be 10 digits' });

  // DOB before 2008-01-01
  if (new Date(dob) >= new Date('2008-01-01')) return res.status(400).json({ error: 'Date of birth must be before 2008-01-01' });

  // -------------------------
  // Build query
  // -------------------------
  let query = `UPDATE users u
    JOIN roles r ON u.role_id = r.id
    SET u.name = ?, u.email = ?, u.phone_number = ?, u.address = ?, u.dob = ?, u.gender = ?`;
  
  const params = [name, email, phone_number, address, dob, gender];

  if (req.file) {
    query += ', u.picture = ?';
    params.push(req.file.filename);
  }

  query += ' WHERE u.id = ? AND r.role_name = "teacher"';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Profile updated successfully' });
  });
});

export default router;