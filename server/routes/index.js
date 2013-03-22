
var utils = require('express').utils;

var usercount = 13;


exports.index = function(req, res){
  if(!req.session.user) {
  	req.session.user = 'Unnamed_Player'+usercount++;
  }
  
  res.render('index', { title: 'Express' });
};

exports.setio = function(io) {
	io.sockets.on('connection', function (socket) {
		socket.emit('news', { hello: 'world' });
		socket.on('my other event', function (data) {
			console.log(data);
		});
	});
}
