const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index1.html'));
});

const players = {};
const messages = [];

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Default player data
  players[socket.id] = {
    id: socket.id,
    name: "Player",           // Default name
    x: 350,
    y: 250,
    frame: 0,
    facingLeft: false,
    currentDir: 'front'
  };

  socket.emit('currentPlayers', players);
  socket.emit('chatHistory', messages);

  socket.broadcast.emit('playerJoined', players[socket.id]);

  // Set Name
  socket.on('setName', (name) => {
    if (players[socket.id]) {
      const cleanName = name.trim().substring(0, 15); // Max 15 characters
      players[socket.id].name = cleanName || "Player";
      
      // Broadcast new name to everyone
      io.emit('playerUpdated', players[socket.id]);
    }
  });

  socket.on('chatMessage', (text) => {
    if (!text || text.trim() === '') return;
    
    const message = {
      id: socket.id,
      name: players[socket.id].name,
      text: text.trim(),
      timestamp: Date.now()
    };

    messages.push(message);
    if (messages.length > 50) messages.shift();

    io.emit('chatMessage', message);
  });

  socket.on('playerMovement', (data) => {
    if (players[socket.id]) {
      players[socket.id] = { ...players[socket.id], ...data };
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('👤 Name system + Chat enabled');
});