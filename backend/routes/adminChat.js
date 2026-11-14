import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

async function checkAndCreateMessageNotification(req, senderId, receiverId, messageText = '') {
    try {
        const receiverQuery = await query(`
            SELECT r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [receiverId]);

        if (receiverQuery.length > 0 && ['student', 'teacher', 'admin'].includes(receiverQuery[0].role_name.toLowerCase().trim())) {
            const senderQuery = await query('SELECT name FROM users WHERE id = ?', [senderId]);
            const senderName = senderQuery[0]?.name || 'Admin';
            const notifTitle = `Message from ${senderName}`;
            // Use actual message content sent by user/admin; fallback only if empty
            const notifDesc = messageText && messageText.trim() ? messageText.trim() : `New message from ${senderName}`;
            
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

// 1. Fetch all active conversations for the logged-in Admin
router.get('/admin-chat/conversations', async (req, res) => {
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
router.get('/admin-chat/conversations/:id/messages', async (req, res) => {
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
router.post('/admin-chat/send-message', async (req, res) => {
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

        await checkAndCreateMessageNotification(req, senderId, receiverId, message);

        res.status(200).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("Direct Message Error:", error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// 4. Fetch contacts to start a new chat (Teachers, Students & Staff)
router.get('/admin-chat/contacts', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const contacts = await query(`
            SELECT u.id as user_id, u.name, u.picture, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id != ? AND r.role_name IN ('teacher', 'student', 'admin')
            ORDER BY r.role_name, u.name ASC
        `, [userId]);

        res.status(200).json({ success: true, data: contacts });
    } catch (error) {
        console.error("Contacts fetch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 5. Fetch all chat requests for logged-in Admin
router.get('/admin-chat/requests', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const requests = await query(`
            SELECT cr.id, cr.status, cr.message, cr.created_at, u.id as student_id, u.name as student_name, u.email as student_email, u.picture as student_picture
            FROM chat_requests cr
            JOIN users u ON cr.student_id = u.id
            WHERE cr.admin_id = ?
            ORDER BY cr.created_at DESC
        `, [userId]);

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Fetch requests error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 6. Approve/Reject a chat request
router.put('/admin-chat/requests/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        const requestCheck = await query('SELECT student_id FROM chat_requests WHERE id = ? AND admin_id = ?', [id, userId]);
        if (requestCheck.length === 0) {
            return res.status(404).json({ success: false, message: "Request not found or unauthorized." });
        }
        
        const studentId = requestCheck[0].student_id;

        await query('UPDATE chat_requests SET status = ? WHERE id = ?', [status, id]);

        const adminQuery = await query('SELECT name FROM users WHERE id = ?', [userId]);
        const adminName = adminQuery[0]?.name || 'Admin';
        const notifTitle = 'Chat Request Update';
        const notifDesc = `Your request to chat with ${adminName} has been ${status}.`;

        const insertRes = await query(`
            INSERT INTO notifications (user_id, title, description, is_read)
            VALUES (?, ?, ?, FALSE)
        `, [studentId, notifTitle, notifDesc]);

        if (req.io) {
            req.io.to(`user_${studentId}`).emit('new_notification', {
                id: insertRes.insertId,
                title: notifTitle,
                description: notifDesc,
                user_id: studentId,
                is_read: 0,
                created_at: new Date()
            });
            req.io.to(`user_${studentId}`).emit('chat_requests_updated');
        }

        res.status(200).json({ success: true, message: `Request successfully ${status}!` });
    } catch (error) {
        console.error("Update request error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;