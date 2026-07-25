import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store connected users per room for accurate online counts
const roomUsers = new Map();

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join_room', ({ room, participantName }) => {
    currentRoom = room;
    currentUser = participantName;
    socket.join(room);

    // Track user
    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Map());
    }
    const usersInRoom = roomUsers.get(room);
    usersInRoom.set(socket.id, participantName);

    // Broadcast updated presence to the room
    io.to(room).emit('presence_update', usersInRoom.size);
  });

  socket.on('code_update', (payload) => {
    // Relay to everyone else in the room
    socket.to(currentRoom).emit('code_update', payload);
  });

  socket.on('run_result', (payload) => {
    socket.to(currentRoom).emit('run_result', payload);
  });

  socket.on('draw_update', (payload) => {
    socket.to(currentRoom).emit('draw_update', payload);
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      const usersInRoom = roomUsers.get(currentRoom);
      if (usersInRoom) {
        usersInRoom.delete(socket.id);
        io.to(currentRoom).emit('presence_update', usersInRoom.size);
        if (usersInRoom.size === 0) {
          roomUsers.delete(currentRoom);
        }
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
