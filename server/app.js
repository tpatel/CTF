
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , cookie = require('express/node_modules/cookie')
  , utils = require('express/node_modules/connect').utils
  , secret = 'your secret here'
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore();

var toobusy = require('toobusy');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  /*app.use(function(req, res, next) {
    if (toobusy()) res.send(503, "I'm busy right now, sorry.");
    else next();
  });*/
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(secret));
  app.use(express.session({store: sessionStore
        , secret: secret
        , key: 'express.sid'}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

io.set('log level', 1);

io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = cookie.parse(data.headers.cookie);
        data.sessionID = utils.parseSignedCookie(data.cookie['express.sid'], secret);
        if(!data.sessionID) {
        	return accept('Cookie tampered', false);
        }
        
        sessionStore.get(data.sessionID, function (err, session) {
			if (err) {
				return accept(err.message, false);
			} else {
				if(session && session.user) {
					data.session = session; //Accept the session
					//console.log(session);
					return accept(null, true);
				} else {
					return accept('Not authenticated', false);
				}
			}
		});
    } else {
       return accept('No cookie transmitted.', false);
    }
});


routes.setio(io);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
