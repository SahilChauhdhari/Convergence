const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const fs = require('fs');

(async () => {
  const db = await open({ filename: './database.db', driver: sqlite3.Database });
  
  const ucols = (await db.all('PRAGMA table_info(users);')).map(c => c.name);
  const mcols = (await db.all('PRAGMA table_info(messages);')).map(c => c.name);
  const rcols = (await db.all('PRAGMA table_info(rooms);')).map(c => c.name);
  
  const rooms = await db.all('SELECT * FROM rooms;');
  const users = await db.all('SELECT * FROM users;');
  
  const result = { ucols, mcols, rcols, rooms, users };
  fs.writeFileSync('./db-info.json', JSON.stringify(result, null, 2));
  console.log('Done! Written to db-info.json');
})().catch(console.error);
