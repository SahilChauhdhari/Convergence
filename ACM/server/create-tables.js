const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

(async () => {
  const db = await open({ filename: './database.db', driver: sqlite3.Database });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id    INTEGER NOT NULL,
      uploader_id   INTEGER NOT NULL,
      file_path     TEXT    NOT NULL,
      file_size     INTEGER,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('attachments table created/verified OK');
  
  // Verify messages query works
  const msgs = await db.all(`
    SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as message, m.created_at
    FROM messages m
    JOIN users u ON m.sender_id = u.user_id
    WHERE m.room_id = 10 AND (m.is_deleted = 0 OR m.is_deleted IS NULL)
    ORDER BY m.created_at ASC
  `);
  console.log('Room 10 messages:', msgs.length);
  
  const att = await db.all('SELECT * FROM attachments LIMIT 1');
  console.log('Attachments query OK, rows:', att.length);
})().catch(console.error);
