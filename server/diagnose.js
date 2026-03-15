const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const fs = require('fs');

(async () => {
  const db = await open({ filename: './database.db', driver: sqlite3.Database });
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', JSON.stringify(tables.map(t => t.name)));
  
  // Test the exact query that's failing
  try {
    const msgs = await db.all(`
      SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as message, m.created_at
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.room_id = 10 AND (m.is_deleted = 0 OR m.is_deleted IS NULL)
      ORDER BY m.created_at ASC
    `);
    console.log('Messages count for room 10:', msgs.length);
  } catch(e) {
    console.error('Message query error:', e.message);
  }

  // Test attachments table
  try {
    const att = await db.all("SELECT * FROM attachments LIMIT 1");
    console.log('Attachments table OK');
  } catch(e) {
    console.error('Attachments error:', e.message);
  }
})().catch(console.error);
