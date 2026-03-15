const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: process.env.DATABASE_PATH || path.join(__dirname, '../../database.db'),
      driver: sqlite3.Database
    });
    // Ensure foreign keys are enabled
    await dbInstance.exec('PRAGMA foreign_keys = ON');

    // Create attachments table if it doesn't exist
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id    INTEGER NOT NULL,
        uploader_id   INTEGER NOT NULL,
        file_path     TEXT    NOT NULL,
        file_size     INTEGER,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return dbInstance;
}

module.exports = { getDb };