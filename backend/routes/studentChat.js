import express from 'express';
import db from '../db.js';
import util from 'util';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

async function checkAndCreateMessageNotification(req, senderId, receiverId) {
    try {
        const receiverQuery = await query(`
            SELECT r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [receiverId]);

        if (receiverQuery.length > 0 && ['student', 'teacher', 'admin'].includes(receiverQuery[0].role_name.toLowerCase().trim())) {
            const senderQuery = await query('SELECT name FROM users WHERE id = ?', [senderId]);
            const senderName = senderQuery[0]?.name || 'Someone';
            const notifTitle = 'New Message';
            const notifDesc = `New message from ${senderName}`;
            
            const insertRes = await query(`
                INSERT INTO notifications (user_id, title, description, is_read)
                VALUES (?, ?, ?, FALSE)
            `, [receiverId, notifTitle, notifDesc]);

            if (req.io) {
                req.io.to(`user_${receiverId}`).emit('new_notification', {
                    id: insertRes.insertId,
                    title: notifTitle,
                    description: notifDesc,
                    user_id: receiverId,
                    is_read: 0,
                    created_at: new Date()
                });
            }
        }
    } catch (error) {
        console.error("Error in checkAndCreateMessageNotification:", error);
    }
}

const chatStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/chats';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const uploadChat = multer({ storage: chatStorage });

// Common file upload route for chat attachments
router.post('/chat/upload', uploadChat.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        const fileUrl = `/uploads/chats/${req.file.filename}`;
        res.status(200).json({
            success: true,
            fileUrl,
            fileName: req.file.originalname,
            fileType: req.file.mimetype
        });
    } catch (error) {
        console.error("Chat upload error:", error);
        res.status(500).json({ success: false, message: 'File upload failed.' });
    }
});

// 1. Fetch all active conversations for the logged-in Student
router.get('/student-chat/conversations', async (req, res) => {
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
                r.role_name as other_user_role,
                (SELECT COUNT(*) FROM messages m 
                 WHERE m.conversation_id = c.id 
                   AND m.sender_id = u.id 
                   AND m.is_read = FALSE) as unread_count
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

router.get('/student-chat/conversations/:id/messages', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (userId) {
            await query(`
                UPDATE messages 
                SET is_read = TRUE 
                WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE
            `, [req.params.id, userId]);
        }

        const messages = await query(`
            SELECT sender_id, body, file_url, file_type, created_at 
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
router.post('/student-chat/send-message', async (req, res) => {
    try {
        const { senderId, receiverId, message, fileUrl, fileType } = req.body;

        if (!senderId || !receiverId || (!message && !fileUrl)) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // --- BLOCK CHECK VALIDATION ---
        const blockCheck = await query(`
            SELECT blocker_id FROM blocked_users 
            WHERE (blocker_id = ? AND blocked_id = ?) 
               OR (blocker_id = ? AND blocked_id = ?)
        `, [senderId, receiverId, receiverId, senderId]);

        if (blockCheck.length > 0) {
            const hasBlocked = blockCheck.some(b => b.blocker_id === parseInt(senderId));
            return res.status(403).json({ 
                success: false, 
                message: hasBlocked 
                    ? "You have blocked this user. Unblock to message." 
                    : "You cannot message this user." 
            });
        }
        // --- END OF BLOCK CHECK ---

        // --- SECURITY VALIDATION FOR STUDENTS ---
        const senderQuery = await query(`
            SELECT r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [senderId]);
        
        const isStudent = senderQuery.length > 0 && senderQuery[0].role_name.toLowerCase().trim() === 'student';
        
        if (isStudent) {
            const receiverQuery = await query(`
                SELECT r.role_name 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.id = ?
            `, [receiverId]);
            
            if (receiverQuery.length > 0) {
                const receiverRole = receiverQuery[0].role_name.toLowerCase().trim();
                
                if (receiverRole === 'teacher') {
                    const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [senderId]);
                    const studentId = studentRes[0]?.id;
                    
                    const enrollCheck = await query(`
                        SELECT e.id 
                        FROM enrollments e
                        JOIN classes_courses c ON e.c_id = c.id
                        JOIN teachers t ON c.t_id = t.id
                        WHERE e.s_id = ? AND t.user_id = ?
                    `, [studentId || 0, receiverId]);
                    
                    if (enrollCheck.length === 0) {
                        return res.status(403).json({ success: false, message: "You are not authorized to message this teacher. You must be enrolled in one of their courses." });
                    }
                } else if (receiverRole === 'admin') {
                    const requestCheck = await query(`
                        SELECT status FROM chat_requests 
                        WHERE student_id = ? AND admin_id = ? AND status = 'approved'
                    `, [senderId, receiverId]);
                    
                    if (requestCheck.length === 0) {
                        return res.status(403).json({ success: false, message: "You are not authorized to message this admin. You must submit a request and wait for approval." });
                    }
                }
            }
        }
        // --- END OF SECURITY VALIDATION ---

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
            INSERT INTO messages (conversation_id, sender_id, body, file_url, file_type) 
            VALUES (?, ?, ?, ?, ?)
        `, [conversationId, senderId, message || '', fileUrl || null, fileType || null]);

        await query(`
            UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [conversationId]);

        await checkAndCreateMessageNotification(req, senderId, receiverId);

        res.status(200).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Direct Message Error:", error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// 4. Fetch contacts to start a new chat (Restricted: Enrolled teachers & Admins with approval status)
router.get('/student-chat/contacts', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        const studentId = studentRes[0]?.id;

        let teachers = [];
        if (studentId) {
            teachers = await query(`
                SELECT DISTINCT u.id as user_id, u.name, u.picture, r.role_name, NULL as chat_status, NULL as request_id
                FROM enrollments e
                JOIN classes_courses c ON e.c_id = c.id
                JOIN teachers t ON c.t_id = t.id
                JOIN users u ON t.user_id = u.id
                JOIN roles r ON u.role_id = r.id
                WHERE e.s_id = ? AND u.id != ?
            `, [studentId, userId]);
        }

        const admins = await query(`
            SELECT u.id as user_id, u.name, u.picture, r.role_name, cr.status as chat_status, cr.id as request_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN chat_requests cr ON cr.admin_id = u.id AND cr.student_id = ?
            WHERE r.role_name = 'admin' AND u.id != ?
        `, [userId, userId]);

        const contacts = [...teachers, ...admins];
        contacts.sort((a, b) => {
            if (a.role_name !== b.role_name) {
                return a.role_name.localeCompare(b.role_name);
            }
            return a.name.localeCompare(b.name);
        });

        res.status(200).json({ success: true, data: contacts });
    } catch (error) {
        console.error("Contacts fetch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 5. Send message request to an Admin
router.post('/student-chat/request-access', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { adminId, message } = req.body;
        if (!adminId) return res.status(400).json({ success: false, message: "adminId is required." });

        const adminCheck = await query(`
            SELECT r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ? AND r.role_name = 'admin'
        `, [adminId]);

        if (adminCheck.length === 0) {
            return res.status(400).json({ success: false, message: "Recipient is not an admin." });
        }

        await query(`
            INSERT INTO chat_requests (student_id, admin_id, status, message)
            VALUES (?, ?, 'pending', ?)
            ON DUPLICATE KEY UPDATE status = 'pending', message = ?, updated_at = CURRENT_TIMESTAMP
        `, [userId, adminId, message || null, message || null]);

        const studentQuery = await query('SELECT name FROM users WHERE id = ?', [userId]);
        const studentName = studentQuery[0]?.name || 'A student';
        const notifTitle = 'Chat Request';
        const notifDesc = `${studentName} has requested access to message you.`;

        const insertRes = await query(`
            INSERT INTO notifications (user_id, title, description, is_read)
            VALUES (?, ?, ?, FALSE)
        `, [adminId, notifTitle, notifDesc]);

        if (req.io) {
            req.io.to(`user_${adminId}`).emit('new_notification', {
                id: insertRes.insertId,
                title: notifTitle,
                description: notifDesc,
                user_id: adminId,
                is_read: 0,
                created_at: new Date()
            });
            req.io.to(`user_${adminId}`).emit('chat_requests_updated');
        }

        res.status(200).json({ success: true, message: "Chat request sent successfully!" });
    } catch (error) {
        console.error("Chat request error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get total unread messages count for logged-in user
router.get('/chat/unread-count', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(200).json({ success: true, count: 0 });

        const result = await query(`
            SELECT COUNT(*) AS count 
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE (c.participant1_id = ? OR c.participant2_id = ?)
              AND m.sender_id != ?
              AND m.is_read = FALSE
        `, [userId, userId, userId]);

        res.status(200).json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        console.error("Unread count error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Mark messages in a conversation as read
router.put('/chat/conversations/:id/read', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { id: conversationId } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        await query(`
            UPDATE messages 
            SET is_read = TRUE 
            WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE
        `, [conversationId, userId]);

        res.status(200).json({ success: true, message: "Messages marked as read" });
    } catch (error) {
        console.error("Error marking messages read:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Mark all "New Message" notifications for logged-in user as read
router.put('/chat/mark-notifications-read', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        await query(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = ? AND title = 'New Message' AND is_read = 0
        `, [userId]);

        // Also emit notification update to socket so the bell icon updates in real-time
        if (req.io) {
            req.io.to(`user_${userId}`).emit('new_notification');
        }

        res.status(200).json({ success: true, message: "Chat notifications marked as read" });
    } catch (error) {
        console.error("Error marking chat notifications as read:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 6. Block a user
router.post('/chat/block', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { blockedId } = req.body;
        if (!blockedId) return res.status(400).json({ success: false, message: "blockedId is required." });

        if (parseInt(userId) === parseInt(blockedId)) {
            return res.status(400).json({ success: false, message: "You cannot block yourself." });
        }

        await query(`
            INSERT INTO blocked_users (blocker_id, blocked_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE blocker_id = blocker_id
        `, [userId, blockedId]);

        res.status(200).json({ success: true, message: "User blocked successfully!" });
    } catch (error) {
        console.error("Block user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 7. Unblock a user
router.post('/chat/unblock', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { blockedId } = req.body;
        if (!blockedId) return res.status(400).json({ success: false, message: "blockedId is required." });

        await query(`
            DELETE FROM blocked_users 
            WHERE blocker_id = ? AND blocked_id = ?
        `, [userId, blockedId]);

        res.status(200).json({ success: true, message: "User unblocked successfully!" });
    } catch (error) {
        console.error("Unblock user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 8. Check blocked status
router.get('/chat/check-blocked/:otherUserId', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { otherUserId } = req.params;

        const result = await query(`
            SELECT blocker_id, blocked_id 
            FROM blocked_users 
            WHERE (blocker_id = ? AND blocked_id = ?) 
               OR (blocker_id = ? AND blocked_id = ?)
        `, [userId, otherUserId, otherUserId, userId]);

        const isBlockedByMe = result.some(r => r.blocker_id === parseInt(userId));
        const isBlockedByThem = result.some(r => r.blocker_id === parseInt(otherUserId));

        res.status(200).json({ 
            success: true, 
            isBlockedByMe, 
            isBlockedByThem 
        });
    } catch (error) {
        console.error("Check blocked status error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;