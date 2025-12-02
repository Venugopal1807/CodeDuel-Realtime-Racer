
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

// Enabling CORS for Express
app.use(cors());

// Health Checking Route
app.get('/', (req, res) => {
  res.send('✅ CodeDuel Server is RUNNING! Socket.io is ready.');
});

const server = http.createServer(app);

// Socket.io Setup with Explicit CORS
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// STATE MANAGEMENT
interface Player {
  id: string;
  username: string;
  progress: number;
  wpm: number;
}

interface Room {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  text: string;
}

const rooms = new Map<string, Room>();

const CODE_SNIPPETS = [
  "const sum = (a, b) => a + b;",
  "function binarySearch(arr, target) { let left = 0; let right = arr.length - 1; }",
  "import React, { useState, useEffect } from 'react';",
  "console.log('Hello World');",
  "const [data, setData] = useState(null);"
];

io.on('connection', (socket) => {
  console.log(`🔌 Client Connected: ${socket.id}`);

  socket.on('join_room', ({ username, roomId }) => {
    let room = rooms.get(roomId);

    // Creating a room if it doesn't exist
    if (!room) {
      console.log(`Creating Room: ${roomId}`);
      room = {
        id: roomId,
        players: [],
        status: 'waiting',
        text: CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
      };
      rooms.set(roomId, room);
    }

    // Add player logic
    const existingPlayer = room.players.find(p => p.id === socket.id);
    
    if (!existingPlayer && room.players.length < 2) {
      console.log(`${username} joined ${roomId}`);
      const newPlayer = { id: socket.id, username, progress: 0, wpm: 0 };
      room.players.push(newPlayer);
      socket.join(roomId);
    } else if (existingPlayer) {
       socket.join(roomId);
    } else {
      socket.emit('error', 'Room is full');
      return;
    }

    // Notify room
    io.to(roomId).emit('room_update', room);

    // Start Game Check
    if (room.players.length === 2 && room.status === 'waiting') {
      room.status = 'playing';
      io.to(roomId).emit('game_start', room);
    }
  });

  socket.on('type_progress', ({ roomId, progress, wpm }) => {
    const room = rooms.get(roomId);
    if (room && room.status === 'playing') {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.progress = progress;
        player.wpm = wpm;
        
        io.to(roomId).emit('player_update', room.players);

        if (progress >= 100) {
          room.status = 'finished';
          io.to(roomId).emit('game_over', { winner: player.username });
        }
      }
    }
  });

  socket.on('restart_game', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.players.forEach(p => { p.progress = 0; p.wpm = 0; });
      room.text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
      room.status = 'playing';
      io.to(roomId).emit('game_start', room);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client Disconnected: ${socket.id}`);
    rooms.forEach((room, roomId) => {
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        room.status = 'waiting'; 
        io.to(roomId).emit('room_update', room);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`----------------------------------------`);
  console.log(`✅ SERVER RUNNING ON PORT ${PORT}`);
  console.log(`👉 Test URL: http://localhost:${PORT}`);
  console.log(`----------------------------------------`);
});
