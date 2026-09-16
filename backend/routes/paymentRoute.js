import express from 'express';
import crypto from 'crypto';
import db from '../db.js'; 
import util from 'util';
import { sendEnrollmentEmail } from '../emailService.js';
import multer from 'multer';
import { slipStorage } from '../cloudinaryConfig.js';

const uploadSlip = multer({ storage: slipStorage });

const query = util.promisify(db.query).bind(db);
const router = express.Router();

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1234834'; 
// Default to the Localhost secret if no environment variable is provided
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'MTM4MDI1MTA5MDIzNTk2OTY3MjcyNDYwNjMzODc3MzQ4ODk0MDA5Nw=='; 

// ==========================================
// 1. ROUTE TO GENERATE HASH
// ==========================================
router.post('/payment/generate-hash', (req, res) => {
    const { order_id, amount, currency } = req.body;

    const hashedSecret = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(amount).toFixed(2);

    const hash = crypto.createHash('md5').update(
        MERCHANT_ID + order_id + amountFormatted + currency + hashedSecret
    ).digest('hex').toUpperCase();

    res.status(200).json({ hash: hash });
});

// ==========================================
// 2. ROUTE FOR PAYHERE WEBHOOK (Notify URL)
// ==========================================
router.post('/payment/notify', async (req, res) => {
    console.log("🚨 PAYHERE EKEN MESSAGE EKAK AAWA!");
    
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body || {};

    const hashedSecret = crypto.createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(payhere_amount).toFixed(2);
    
    const localMd5sig = crypto.createHash('md5').update(
        merchant_id + order_id + amountFormatted + payhere_currency + status_code + hashedSecret
    ).digest('hex').toUpperCase();

    if (localMd5sig === md5sig) {
        if (status_code === '2' || status_code === 2) {
            const [classId, moduleId, userId, timestamp] = order_id.split('_');

            try {
                const studentData = await query(`
                    SELECT s.id, u.email, u.name 
                    FROM students s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.user_id = ?
                `, [userId]);
                
                if (studentData.length > 0) {
                    const actualStudentId = studentData[0].id;
                    const studentEmail = studentData[0].email;
                    const studentName = studentData[0].name;

                    // 1. Save Payment
                    await query(`
                        INSERT INTO payments (invoice_link, amount, status, c_id, s_id) 
                        VALUES (?, ?, 'completed', ?, ?)
                    `, [order_id, payhere_amount, classId, actualStudentId]);
                    console.log("✅ Payment Saved to DB Successfully!");

                    // 🌟 2. Enroll Student to the Class
                    try {
                        await query(`
                            INSERT IGNORE INTO enrollments (s_id, c_id) 
                            VALUES (?, ?)
                        `, [actualStudentId, classId]);
                        console.log("🎓 Student successfully enrolled in the class via Webhook!");
                        
                        // Send Email Notification
                        const courseData = await query('SELECT title FROM classes_courses WHERE id = ?', [classId]);
                        if (courseData.length > 0 && studentEmail) {
                            sendEnrollmentEmail(studentEmail, studentName, courseData[0].title);
                        }
                        
                        // 3. Add Notification
                        try {
                            await query(`
                                INSERT INTO notifications (user_id, title, description, is_read)
                                VALUES (?, 'Payment Successful', 'Your payment was successful and you have been enrolled.', 0)
                            `, [userId]);
                        } catch (notifErr) {
                            console.error("⚠️ Notification save warning:", notifErr);
                        }
                    } catch (e) {
                        console.error("⚠️ Enrollment warning:", e);
                    }

                    res.status(200).send("OK"); 
                } else {
                    console.error("❌ ERROR: Student not found in DB:", userId);
                    res.status(500).send("Student Not Found");
                }
            } catch (error) {
                console.error("❌ DB Error during payment save:", error);
                res.status(500).send("DB Error");
            }
        } else {
            console.log("⚠️ Payment not successful. Status:", status_code);
            res.status(200).send("Ignored"); 
        }
    } else {
        console.log("❌ Hash mismatch! Fake request detected.");
        res.status(400).send("Hash mismatch");
    }
});

// ==========================================
// 3. MANUAL UNLOCK ROUTE (Frontend Trigger)
// ==========================================
router.post('/payment/manual-success', async (req, res) => {
    console.log("\n========================================");
    console.log("🛠️ MANUAL SUCCESS ROUTE HIT!");
    console.log("📦 Frontend Data:", req.body);
    console.log("========================================\n");

    const { order_id, amount, classId, userId } = req.body;
    
    
    const finalClassId = classId || order_id.split('_')[0];
    
    try {
        console.log(`🔍 Finding student (userId: ${userId})...`);
        const studentData = await query(`
            SELECT s.id, u.email, u.name 
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.user_id = ?
        `, [userId]);
        
        if (studentData.length > 0) {
            const actualStudentId = studentData[0].id;
            const studentEmail = studentData[0].email;
            const studentName = studentData[0].name;
            console.log(`✅ Student found! (DB id: ${actualStudentId})`);
            
            const existing = await query('SELECT id FROM payments WHERE invoice_link = ?', [order_id]);
            
            if (existing.length === 0) {
                // 1. Save Payment
                await query(`
                    INSERT INTO payments (invoice_link, amount, status, c_id, s_id) 
                    VALUES (?, ?, 'completed', ?, ?)
                `, [order_id, amount, finalClassId, actualStudentId]);
                console.log(`💾 Payment saved for Class ID: ${finalClassId}`);
                
                // 🌟 2. Enroll Student to the Class
                try {
                    await query(`
                        INSERT IGNORE INTO enrollments (s_id, c_id) 
                        VALUES (?, ?)
                    `, [actualStudentId, finalClassId]);
                    console.log("🎓 SUCCESS: Student officially enrolled in the class!");
                    
                    // Send Email Notification
                    const courseData = await query('SELECT title FROM classes_courses WHERE id = ?', [finalClassId]);
                    if (courseData.length > 0 && studentEmail) {
                        sendEnrollmentEmail(studentEmail, studentName, courseData[0].title);
                    }
                    
                    // 3. Add Notification
                    try {
                        await query(`
                            INSERT INTO notifications (user_id, title, description, is_read)
                            VALUES (?, 'Payment Successful', 'Your payment was successful and you have been enrolled.', 0)
                        `, [userId]);
                    } catch (notifErr) {
                        console.error("⚠️ Notification save warning:", notifErr);
                    }
                } catch (enrollError) {
                    console.error("⚠️ Enrollment save warning:", enrollError);
                }

            } else {
                console.log("⚠️ WARNING: Payment already saved previously.");
            }
            res.status(200).send("OK");
        } else {
            console.log(`❌ ERROR: Student not found! (userId: ${userId})`);
            res.status(404).send("Student not found");
        }
    } catch (error) {
        console.log("\n❌❌ DATABASE ERROR EKAK AWA! ❌❌");
        console.error(error);
        res.status(500).send("Error");
    }
});
// ==========================================
// 4. BANK SLIP UPLOAD ROUTE
// ==========================================
router.post('/payment/slip-upload', uploadSlip.single('slip_image'), async (req, res) => {
    console.log("🛠️ SLIP UPLOAD ROUTE HIT!");
    try {
        const { classId, userId, amount } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "Slip image is required" });
        }

        const slipUrl = file.path; 

        // Find student
        const studentData = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        
        if (studentData.length > 0) {
            const actualStudentId = studentData[0].id;
            
            // Generate a dummy invoice link or reference for slip
            const order_id = `SLIP_${classId}_${userId}_${Date.now()}`;

            await query(`
                INSERT INTO payments (invoice_link, amount, status, payment_method, slip_url, c_id, s_id) 
                VALUES (?, ?, 'pending_approval', 'slip', ?, ?, ?)
            `, [order_id, amount, slipUrl, classId, actualStudentId]);
            
            console.log(`✅ Slip Payment pending for Class ID: ${classId}, Student ID: ${actualStudentId}`);

            // 🌟 Send notifications to all Admins and Moderators
            try {
                const admins = await query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name IN ('admin', 'moderator', 'subadmin')");
                if (admins.length > 0) {
                    const notifyPromises = admins.map(admin => 
                        query(`
                            INSERT INTO notifications (user_id, title, description, is_read)
                            VALUES (?, 'New Slip Pending Approval', ?, 0)
                        `, [admin.id, `A new bank slip payment (LKR ${amount}) was uploaded for Class ID ${classId} by Student ID ${actualStudentId}. Please review it in the dashboard.`])
                    );
                    await Promise.all(notifyPromises);
                    console.log("✅ Admins/Moderators successfully notified of slip upload.");
                }
            } catch (notifyErr) {
                console.error("⚠️ Failed to notify admins:", notifyErr);
            }

            res.status(200).json({ success: true, message: "Slip uploaded successfully. Pending admin approval." });
        } else {
            res.status(404).json({ error: "Student not found" });
        }
    } catch (error) {
        console.error("❌ DB Error during slip upload:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;