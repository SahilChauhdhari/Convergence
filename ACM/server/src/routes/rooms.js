const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../models/database');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: 'Room name required' });

  // Only certain roles can create rooms according to new schema, but we'll simplify for Demo
  // We check if their role_level is >= 40 (Team Lead)
  const role_level = req.user.role_level || 10;
  if (role_level < 40) {
    return res.status(403).json({ error: 'Insufficient permissions to create rooms' });
  }

  try {
    const db = await getDb();
    
    const result = await db.run(`
      INSERT INTO rooms (room_name, description, created_by) VALUES (?, ?, ?)
    `, [name, description || '', req.user.id]);

    const room = await db.get('SELECT * FROM rooms WHERE room_id = ?', result.lastID);
    
    // Add creator to room_members automatically
    await db.run('INSERT INTO room_members (room_id, user_id, member_role, can_post, can_invite) VALUES (?, ?, ?, ?, ?)',
      [result.lastID, req.user.id, 'owner', 1, 1]);

    res.status(201).json({ id: room.room_id, name: room.room_name, description: room.description });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Room already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  const role_level = req.user.role_level || 10;

  try {
    const db = await getDb();
    let rooms;
    
    if (role_level < 50) { // Not an admin
      rooms = await db.all(`
        SELECT r.room_id as id, r.room_name as name, r.description, rm.member_role as my_role
        FROM rooms r
        JOIN room_members rm ON r.room_id = rm.room_id
        WHERE rm.user_id = ? AND r.is_active = 1
      `, [req.user.id]);
    } else {
      rooms = await db.all('SELECT room_id as id, room_name as name, description FROM rooms WHERE is_active = 1');
    }
    
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/members', authMiddleware, async (req, res) => {
  const role_level = req.user.role_level || 10;

  if (role_level < 40) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const db = await getDb();
    const members = await db.all(`
      SELECT u.user_id as id, u.username, u.full_name as role, rm.joined_at, rm.member_role
      FROM room_members rm
      JOIN users u ON rm.user_id = u.user_id
      WHERE rm.room_id = ?
    `, [req.params.id]);

    res.json(members);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  const role_level = req.user.role_level || 10;

  if (role_level < 50) { // Only admins/moderators can kick easily in this simplified backend
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const db = await getDb();
    const removedMember = await db.get(`
      SELECT * FROM room_members WHERE room_id = ? AND user_id = ?
    `, [req.params.id, req.params.userId]);

    if(removedMember) {
        await db.run('DELETE FROM room_members WHERE room_id = ? AND user_id = ?', 
          [req.params.id, req.params.userId]);
        res.json({ message: 'Member removed successfully' });
    } else {
        res.status(404).json({ error: 'Member not found' });
    }
  } catch(err) {
     res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const rooms = await db.all('SELECT room_id as id, room_name as name, description FROM rooms WHERE is_active = 1 ORDER BY created_at DESC');
    res.json(rooms);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;