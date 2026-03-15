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

    if (req.io) {
      req.io.to(req.params.roomId.toString()).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room messages
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    
    // Check room privacy — only block if it's a private room and user isn't a member
    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', [req.params.roomId]);
    if (room && room.is_private) {
      const member = await db.get(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
        [req.params.roomId, req.user.id]
      );
      if (!member && req.user.role_level < 60) {
        return res.status(403).json({ error: 'Not a member of this private room' });
      }
    }

    const messages = await db.all(`
      SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as message, m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.room_id = ? AND (m.is_deleted = 0 OR m.is_deleted IS NULL)
      ORDER BY m.created_at ASC
    `, [req.params.roomId]);

    // Fetch attachments for all messages - gracefully skip if table doesn't exist
    for (let msg of messages) {
      try {
        const attachments = await db.all('SELECT file_path as name FROM attachments WHERE message_id = ?', [msg.id]);
        msg.attachments = attachments.length ? attachments : [];
      } catch (e) {
        msg.attachments = []; // attachments table might not exist yet
      }
    }

    res.json(messages);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});


const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage })

router.post('/:roomId/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const db = await getDb();
    const { content } = req.body;
    const file = req.file;

    const result = await db.run('INSERT INTO messages (room_id, sender_id, message_content) VALUES (?, ?, ?)',
      [req.params.roomId, req.user.id, content || '']
    );

    const messageId = result.lastID;
    let attachmentObj = null;

    if (file) {
      const filePath = `/uploads/${file.filename}`;
      await db.run('INSERT INTO attachments (message_id, uploader_id, file_path, file_size) VALUES (?, ?, ?, ?)',
        [messageId, req.user.id, filePath, file.size]
      );
      attachmentObj = { name: filePath };
    }

    const message = await db.get(`
      SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as message, m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.message_id = ?
    `, [messageId]);

    message.attachments = attachmentObj ? [attachmentObj] : [];

    if (req.io) {
      req.io.to(req.params.roomId.toString()).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;