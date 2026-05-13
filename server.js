const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  cors:{ origin:"*" }
});

app.use(express.static(__dirname));

const players = {};
const messages = [];

io.on("connection",(socket)=>{

  players[socket.id]={
    id:socket.id,
    x:400,y:300,
    frame:0,
    facingLeft:false,
    currentDir:"front",
    name:"Player",
    character:"original"
  };

  socket.emit("currentPlayers",players);

  socket.broadcast.emit("playerJoined",players[socket.id]);

  socket.on("setPlayerData",(data)=>{
    if(!players[socket.id]) return;

    players[socket.id].name =
      (data.name||"Player").substring(0,15);

    players[socket.id].character =
      data.character||"original";

    io.emit("playerMoved",players[socket.id]);
  });

  socket.on("playerMovement",(data)=>{
    if(!players[socket.id]) return;

    players[socket.id]={
      ...players[socket.id],
      ...data,
      id:socket.id
    };

    socket.broadcast.volatile.emit(
      "playerMoved",
      players[socket.id]
    );
  });

  socket.on("disconnect",()=>{
    delete players[socket.id];
    io.emit("playerDisconnected",socket.id);
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{
  console.log("Server running on",PORT);
});
