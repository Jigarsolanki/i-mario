var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var playerCount = 0;
var id = 0;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('/index.html');
});

io.on('connection', function (socket) {
  playerCount++;
  id++;
  socket.playerId = id;
  setTimeout(function(){socket.emit('selfConnect', { playerCount: playerCount, playerId: id })}, 1500);
  socket.broadcast.emit('connected', { playerCount: playerCount, playerId: socket.playerId });
  console.log(new Date + " Player connected, count: " + playerCount);
  socket.on('disconnect', function (){
    playerCount--;
    io.emit('disconnected', { playerCount: playerCount, playerId: this.playerId });
    console.log(new Date + " Player disconnected, count: " + playerCount);
  });
  socket.on('information', function(data){
    io.emit('information', data);
  });
});

server.listen(3000);
console.log("Multiplayer app listening on port 3000");
