const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../models/database');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, email, full_name, role_name } = req.body;

  if (!username || !password || !email || !full_name) {
    return res.status(400).json({ error: 'Username, password, email, and full_name are required' });
  }

  try {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Find role_id based on role name, default to 'Intern' (level 10)
    const roleRecord = await db.get('SELECT role_id FROM roles WHERE role_name = ?', role_name || 'Intern');
    const role_id = roleRecord ? roleRecord.role_id : 10;

    const result = await db.run(
      'INSERT INTO users (username, full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      [username, full_name, email, hashedPassword, role_id]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await getDb();
    
    // Join with roles table to get role info
    const user = await db.get(`
      SELECT u.*, r.role_name, r.role_level 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE u.username = ?
    `, [username]);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Compare raw password with hashed password directly from DB
    // (Note: The user provided DB might have plainly inserted strings or different hashes, but we'll try proper bcrypt.
    // If it fails, we fall back to direct comparison for the demo hashes like 'hash_ceo_001')
    let isValid = false;
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
        isValid = await bcrypt.compare(password, user.password_hash);
    } else {
        isValid = password === user.password_hash;
    }
    
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ 
      id: user.user_id, 
      username: user.username, 
      role: user.role_name,
      role_level: user.role_level 
    }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    res.json({ token, user: { id: user.user_id, username: user.username, role: user.role_name, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get(`
      SELECT u.*, r.role_name, r.role_level 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE u.user_id = ?
    `, [req.user.id]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ 
      id: user.user_id, 
      username: user.username, 
      role: user.role_name, 
      role_level: user.role_level,
      full_name: user.full_name 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', require('../middleware/auth'), async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const db = await getDb();
    
    const users = await db.all(`
      SELECT user_id as id, username, full_name as name
      FROM users 
      WHERE username LIKE ? OR full_name LIKE ?
      LIMIT 10
    `, [`%${query}%`, `%${query}%`]);

    // Don't return the calling user
    res.json(users.filter(u => u.id !== req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;