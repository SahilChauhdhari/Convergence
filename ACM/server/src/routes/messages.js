const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../models/database');
const router = express.Router();

// Send message
router.post('/:roomId', authMiddleware, async (req, res) => {
  const role = req.user.role;

  try {
    const db = await getDb();
    
    // Check if user is in room
    const member = await db.get(`
      SELECT * FROM room_members
      WHERE room_id = ? AND user_id = ?
    `, [req.params.roomId, req.user.id]);

    if (!member && req.user.role_level < 60) {
      // Allow Senior Admins+ to bypass membership in this demo
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content required' });
    }

    const result = await db.run('INSERT INTO messages (room_id, sender_id, message_content) VALUES (?, ?, ?)',
      [req.params.roomId, req.user.id, content]
    );

    const message = await db.get(`
      SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as message, m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.message_id = ?
    `, [result.lastID]);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room messages
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    
    // Check if user is in room
    const member = await db.get(`
      SELECT * FROM room_members
      WHERE room_id = ? AND user_id = ?
    `, [req.params.roomId, req.user.id]);

    if (!member && req.user.role_level < 60) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const messages = await db.all(`
      SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as message, m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC
    `, [req.params.roomId]);

    res.json(messages);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;