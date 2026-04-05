import express from 'express';
import db from '../db.js';
import util from 'util'; // 🌟 Added util to support modern queries

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// Get all teachers
router.get('/teachers', (req, res) => {
    const sqlQuery = `
        SELECT u.id, u.name, u.picture, u.email
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.role_name = ?
    `;

    db.query(sqlQuery, ['teacher'], (err, results) => {
        if (err) {
            console.error('Error fetching teachers:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        res.status(200).json({
            success: true,
            teachers: results,
            count: results.length
        });
    });
});

// Get a specific teacher by ID
router.get('/teachers/:id', (req, res) => {
    const { id } = req.params;

    const sqlQuery = `
        SELECT u.id, u.name, u.picture, u.email
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND r.role_name = ?
    `;

    db.query(sqlQuery, [id, 'teacher'], (err, results) => {
        if (err) {
            console.error('Error fetching teacher:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.status(200).json({
            success: true,
            teacher: results[0]
        });
    });
});

// ==========================================
// 🌟 NEW: TEACHER SECURE CHAT ROUTES
// ==========================================

// 1. Fetch all active conversations for the logged-in Teacher
router.get('/teacher-chat/conversations', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const conversations = await query(`
            SELECT 
                c.id as conversation_id, 
                c.last_message_at,
                u.id as other_user_id, 
                u.name as other_user_name, 
                u.picture as other_user_picture,
                r.role_name as other_user_role
            FROM conversations c
            JOIN users u ON (u.id = c.participant1_id OR u.id = c.participant2_id) AND u.id != ?
            JOIN roles r ON u.role_id = r.id
            WHERE c.participant1_id = ? OR c.participant2_id = ?
            ORDER BY c.last_message_at DESC
        `, [userId, userId, userId]);

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        console.error("Chat fetch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 2. Fetch messages for a specific conversation
router.get('/teacher-chat/conversations/:id/messages', async (req, res) => {
    try {
        const messages = await query(`
            SELECT sender_id, body, created_at 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
        `, [req.params.id]);

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load messages." });
    }
});

// 3. Send a message
router.post('/teacher-chat/send-message', async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;

        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const convQuery = await query(`
            SELECT id FROM conversations 
            WHERE (participant1_id = ? AND participant2_id = ?) 
               OR (participant1_id = ? AND participant2_id = ?)
        `, [senderId, receiverId, receiverId, senderId]);

        let conversationId;

        if (convQuery.length > 0) {
            conversationId = convQuery[0].id;
        } else {
            const newConv = await query(`
                INSERT INTO conversations (participant1_id, participant2_id) 
                VALUES (?, ?)
            `, [senderId, receiverId]);
            conversationId = newConv.insertId;
        }

        await query(`
            INSERT INTO messages (conversation_id, sender_id, body) 
            VALUES (?, ?, ?)
        `, [conversationId, senderId, message]);

        await query(`
            UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [conversationId]);

        res.status(200).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Direct Message Error:", error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// 4. Fetch users to start a new chat (Students & Admins)
router.get('/teacher-chat/contacts', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const contacts = await query(`
            SELECT u.id as user_id, u.name, u.picture, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id != ? AND r.role_name IN ('student', 'admin')
            ORDER BY r.role_name, u.name ASC
        `, [userId]);

        res.status(200).json({ success: true, data: contacts });
    } catch (error) {
        console.error("Contacts fetch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;