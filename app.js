var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var origins = require('./origins.json')

io.origins((origin, callback) => {
  if (!origins.origins.includes(origin)) {
    return callback('Origin not allowed', false);
  }
  callback(null, true);
});

let users = []
let highscore = null

io.on('connection', function(socket){

  console.log('New socket connected: ' + socket.id);
  //users[socket.id] = {}
  users.push({id: socket.id, name: "", score: {}, headers: []})

  socket.emit('players update', GetAllPlayers());
  socket.emit('highscore update', highscore);

  socket.on('disconnect', function(){
    console.log('Socket disconnected: ' + socket.id);
    setTimeout(function(){
      DeleteUser(socket);
    }, 10*60*1000);

  });

  socket.on('player update name', function(name){
    console.log('player update name: ' + name);

    GetUser(socket).name = name;
    //let players =
    io.emit('players update', GetAllPlayers());
    /*socket.broadcast.emit('new competitor', users[socket.id]);*/
  });

  socket.on('player update score', function(score){

    console.log('player update score: ' + score);

    GetUser(socket).score = score;
    io.emit('players update', GetAllPlayers());
    if(CheckHighscore(socket)){
      io.emit('highscore update', highscore);
    }
  });

  socket.on('player update headers', function(headers){

    console.log('player update headers: ' + headers);

    GetUser(socket).headers = headers;
    io.emit('players update', GetAllPlayers());

  });

});

http.listen((process.env.PORT || 3000), function(){
  console.log('listening on *:' + (process.env.PORT || 3000));
});

function GetUser(socket){
  return users.filter(user => user.id == socket.id)[0]
}

function DeleteUser(socket){
  let user = GetUser(socket);
  users.splice( users.indexOf(user), 1 );
}

function CheckHighscore(socket){
  let player = GetUser(socket);
  let change = false
  if(!highscore || player.score.score >= highscore.score.score){
    highscore = Object.assign(player);
    change = true;
  }
  return change;
}

function GetAllPlayers(){
  return users.filter(user => user.name)
}
