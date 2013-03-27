
var utils = require('express/node_modules/connect').utils;
var model = require('./model');

var usercount = 13;

var rooms = {};

var newClients = [];

var clients = {};


exports.index = function(req, res){
  if(!req.session.user) {
  	req.session.user = 'Unnamed_Player'+usercount++;
  }
  
  res.render('index', { title: 'Express' });
};

exports.setio = function(io) {
	io.sockets.on('connection', function (socket) {
		init(io, socket);
		/*socket.on('my other event', function (data) {
			console.log(data);
		});*/
		socket.on('move', function (data) {
			action(io, socket, data);
		});
		socket.on('shoot', function(data) {
			shoot(io, socket, data);
		});
	});
}

function init(io, socket) {
	var clientID = socket.handshake.sessionID;
	
	if(!clients[clientID]) {
		clients[clientID] = {socket:socket, room:null};
	
		if(newClients.length < 1) {
			var roomID = utils.uid(5);
			while(rooms[roomID]) {
				roomID = utils.uid(5);
			}
			clients[clientID].room = roomID;
			rooms[roomID] = {p1:clientID, p2:null, game:null};
			socket.join(roomID);
			newClients.push(clientID);
		} else {
			var adversaireID = newClients.splice(0,1)[0];
			var roomID = clients[adversaireID].room;
			socket.join(roomID);
			clients[clientID].room = roomID;
			var room = rooms[roomID];
			room.p2 = clientID;
		
		
			//console.log(socket.handshake.session);
			var game = new model.Game();
			game.init();
			room.game = game;
			//console.log(io.sockets.clients(roomID));
			room.game.myTeam = 0;
			clients[room.p1].socket.emit('init', room);
			room.game.myTeam = 1;
			//console.log(io.sockets.in(roomID).sockets[clients[room.p2].socket.id]);
			io.sockets.in(roomID).sockets[clients[room.p2].socket.id].emit('init', room);
			//io.sockets.in(roomID).emit('init', room);
		}
	} else {
		var room = rooms[clients[clientID].room];
		if(room.game) {
			var myTeam = room.p1 == clientID ? 0 : 1;
			room.game.myTeam = myTeam;
			socket.emit('init', room);
		}
	}
}

function action(io, socket, data) {
	var clientID = socket.handshake.sessionID;
	var roomID = clients[clientID].room;
	var room = rooms[roomID];
	
	var game = room.game;
	var myTeam = room.p1 == clientID ? 0 : 1; 
	
	if(game.players[data.id] && game.players[data.id].team == myTeam
			&& game.move(data.id, data.dx, data.dy)) {
		socket.broadcast.to(roomID).emit('move', data);
	} else {
		room.game.myTeam = myTeam;
		socket.emit('init', room);
	}
	
}

function shoot(io, socket, data) {
	var clientID = socket.handshake.sessionID;
	var roomID = clients[clientID].room;
	var room = rooms[roomID];
	
	var game = room.game;
	var myTeam = room.p1 == clientID ? 0 : 1; 
	
	if(game.players[data.id] && game.players[data.id].team == myTeam
			&& game.shoot(data.id, data.idShoot)) {
		socket.broadcast.to(roomID).emit('move', data);
	} else {
		room.game.myTeam = myTeam;
		socket.emit('init', room);
	}
	
}
