const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"*"
  }
});

app.use(express.static(__dirname));

app.get("/",(req,res)=>{

  res.sendFile(
    path.join(__dirname,"index1.html")
  );

});

const players = {};
const messages = [];

io.on("connection",(socket)=>{

  console.log("Player connected:",socket.id);

  players[socket.id] = {

    id:socket.id,
    x:350,
    y:250,
    frame:0,
    facingLeft:false,
    currentDir:"front",
    name:"Player",
    character:"original"

  };

  socket.emit("currentPlayers",players);

  socket.emit("chatHistory",messages);

  socket.broadcast.emit(
    "playerJoined",
    players[socket.id]
  );

  socket.on("setPlayerData",(data)=>{

    if(!players[socket.id]) return;

    players[socket.id].name =
      (data.name || "Player")
      .substring(0,15);

    players[socket.id].character =
      data.character || "original";

    io.emit(
      "playerUpdated",
      players[socket.id]
    );

  });

  socket.on("chatMessage",(text)=>{

    if(!text) return;

    const msg = {

      id:socket.id,
      name:players[socket.id].name,
      text:text.substring(0,200)

    };

    messages.push(msg);

    if(messages.length > 50){
      messages.shift();
    }

    io.emit("chatMessage",msg);

  });

  // FIXED LAG
  socket.on("playerMovement",(data)=>{

    if(!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].frame = data.frame;
    players[socket.id].facingLeft = data.facingLeft;
    players[socket.id].currentDir = data.currentDir;
    players[socket.id].character = data.character;

    socket.broadcast.volatile.emit(
      "playerMoved",
      players[socket.id]
    );

  });

  socket.on("disconnect",()=>{

    console.log(
      "Player disconnected:",
      socket.id
    );

    delete players[socket.id];

    io.emit(
      "playerDisconnected",
      socket.id
    );

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{

  console.log(
    `🚀 Server running on port ${PORT}`
  );

});
