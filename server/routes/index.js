
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
		socket.on('action', function (data) {
			action(io, socket, data);
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
			rooms[roomID] = {p1:socket.id, p2:null, game:null};
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
			io.sockets.in(roomID).emit('init', room);
		}
	} else {
		var room = rooms[clients[clientID].room];
		if(room.game) {
			socket.emit('init', room);
		}
	}
}

function action(io, socket, data) {
	var clientID = socket.handshake.sessionID;
	var roomID = clients[clientID].room;
	var room = rooms[roomID];
	
	var game = room.game;
	
	game.applyGame(data.game);
	
	io.sockets.in(roomID).emit('action', room);
	
}
