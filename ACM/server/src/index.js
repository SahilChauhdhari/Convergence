const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authMiddleware = require('./middleware/auth');
const roomsRouter = require('./routes/rooms');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/users'));
app.use('/api/rooms', authMiddleware, roomsRouter);
app.use('/api/messages', authMiddleware, messagesRouter);

// Ensure DB is initialized before starting
const { getDb } = require('./models/database');

async function startServer() {
  await getDb(); // Initialize db connection and pragmas

  // ... (Express setup)
  
  // Socket.IO for real-time messaging
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      io.to(roomId).emit('room_joined', { roomId, username: socket.data.username });
    });

    socket.on('send_message', async ({ roomId, content }) => {
      // Find the user_id somehow. If using JWT, socket needs to authenticate.
      // For this demo, we'll try to find a user in room_members or fallback to ID 1.
      try {
        const db = await getDb();
        // Since socket payload didn't explicitly send user id, fallback to ID 1 (CEO) for anonymous socket demo, 
        // OR in a real app, middleware extracts user_id to socket.data.userId.
        const userId = socket.data.userId || 1; 

        const result = await db.run('INSERT INTO messages (room_id, sender_id, message_content) VALUES (?, ?, ?)',
          [roomId, userId, content]
        );

        const message = await db.get(`
          SELECT m.message_id as id, m.room_id, m.sender_id as user_id, u.full_name as user_name, m.message_content as content, m.created_at
          FROM messages m
          JOIN users u ON m.sender_id = u.user_id
          WHERE m.message_id = ?
        `, [result.lastID]);

        io.to(roomId).emit('new_message', { ...message, socketId: socket.id });
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User left room: ${roomId}`);
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', {
        roomId,
        username: socket.data.username,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
