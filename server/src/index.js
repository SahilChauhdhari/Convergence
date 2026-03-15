const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authMiddleware = require('./middleware/auth');
const roomsRouter = require('./routes/rooms');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const jwt = require('jsonwebtoken');

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;
    socket.data.role = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', require('./routes/users'));
app.use('/api/rooms', authMiddleware, roomsRouter);
app.use('/api/messages', authMiddleware, messagesRouter);

// Ensure DB is initialized before starting
const { getDb } = require('./models/database');

async function startServer() {
  await getDb(); // Initialize db connection and pragmas

  // ... (Express setup)
  
  const userSockets = new Map(); // userId -> socketId

  // Serve static files for media attachments
  // Use absolute path for uploads folder
  const path = require('path');
  const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Socket.IO for real-time messaging
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Track online user
    if (socket.data.userId) {
      userSockets.set(socket.data.userId, socket.id);
      // Broadcast that this user came online
      io.emit('user_status', { userId: socket.data.userId, status: 'online' });
    }

    // Send the current online users to the newly connected user
    const onlineUsers = Array.from(userSockets.keys());
    socket.emit('online_users', onlineUsers);

    socket.on('join_room', (roomId) => {
      socket.join(roomId.toString());
      io.to(roomId.toString()).emit('room_joined', { roomId, username: socket.data.username });
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
      if (socket.data.userId) {
        userSockets.delete(socket.data.userId);
        io.emit('user_status', { userId: socket.data.userId, status: 'offline' });
      }
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
  });
}

startServer().catch(console.error);

