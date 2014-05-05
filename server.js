var path = require('path')
    , express = require('express')
    , connect = require('express/node_modules/connect')
	, cookie = require('express/node_modules/cookie')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
	, sessionStore = new express.session.MemoryStore({ reapInterval: 60000 * 10 })
	, sessionSecret = "dombioinfo"
    , port = process.env.PORT || 1337
    , serverName = "dev.domblock.com";

// Public API: distinct app (Express) and actual server (HttpServer)
module.exports = { app: app, server: server };

/** Configuration */
app.configure(function() {
    this.engine('ejs', require('ejs-locals'));
    this.set('views', path.join(__dirname, 'views'));
    this.set('view engine', 'ejs');
    this.use(express.static(path.join(__dirname, '/public')));

    // Allow parsing cookies from request headers
    this.use(express.cookieParser());
    // Session management
    // Internal session data storage engine, this is the default engine embedded with connect.
    // Much more can be found as external modules (Redis, Mongo, Mysql, file...). look at "npm search connect session store"
    this.use(express.session({
        // Private crypting key
        "secret": sessionSecret,
        "store": sessionStore
    }));
	// Allow parsing form data
	this.use(express.bodyParser());
});
app.configure('development', function(){
    this.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
    this.use(express.errorHandler());
});

/** Middleware for limited access */
function requireLogin (req, res, next) {
    if (req.session.username) {
        // User is authenticated, let him in
        next();
    } else {
        // Otherwise, we redirect him to login form
        res.redirect("/login");
    }
}

/** Routes */
/** Home page (requires authentication) */
app.get('/', [requireLogin], function (req, res, next) {
    res.render('index');
});
/** Login form */
app.get("/login", function (req, res) {
    // Show form, default value = current username
    res.render("login", { "username": req.session.username, "error": null });
});
app.post("/login", function (req, res) {
    var options = { "username": req.body.username, "error": null };
    if (!req.body.username) {
        options.error = "User name is required";
        res.render("login", options);
    } else if (req.body.username == req.session.username) {
        // User has not changed username, accept it as-is
        res.redirect("/");
    } else if (!req.body.username.match(/^[a-zA-Z0-9\-_]{3,}$/)) {
        options.error = "User name must have at least 3 alphanumeric characters";
        res.render("login", options);
    } else {
        // Validate if username is free
		sessionStore.all(function (err, sessions) {
			if (!err) {
				var found = false;
				for (var i=0; i<sessions.length; i++) {
					var session = JSON.parse(sessions[i]);
					if (session.username == req.body.username) {
						err = "User name already used by someone else";
						found = true;
						break;
					}
				}
			}
			if (err) {
				options.error = ""+err;
				res.render("login", options);
			} else {
				req.session.username = req.body.username;
				res.redirect("/");
			}
		});
	}
});

/** WebSocket */
//var sockets = require('socket.io').listen(server).of('/');
var io = require('socket.io').listen(server);
var parseCookie = connect.utils.parseCookie;
io.sockets.authorization(function (handshakeData, callback) {
    // Read cookies from handshake headers
    var cookies = cookie.parse(handshakeData.headers.cookie);
    // We're now able to retrieve session ID
    var sessionID;
    // No session? Refuse connection
    if (cookies['connect.sid']) {
        sessionID = connect.utils.parseSignedCookie(cookies['connect.sid'], sessionSecret);
    }

    if (!sessionID) {
        callback('No session', false);
    } else {
        // Store session ID in handshake data, we'll use it later to associate
        // session with open sockets
        handshakeData.sessionID = sessionID;
        // On récupère la session utilisateur, et on en extrait son username
        sessionStore.get(sessionID, function (err, session) {
            if (!err && session && session.username) {
                // On stocke ce username dans les données de l'authentification, pour réutilisation directe plus tard
                handshakeData.username = session.username;
                // OK, on accepte la connexion
                callback(null, true);
            } else {
                // Session incomplète, ou non trouvée
                callback(err || 'User not authenticated', false);
            }
        });
    }
});

var clientList = new Array();

io.sockets.on('connection', function(socket) {
	// now we have a client object!
	console.log("[connection] Connection accepted.");
	var sessionID = socket.handshake.sessionID; // Store session ID from handshake
	// this is required if we want to access this data when user leaves, as handshake is
	// not available in "disconnect" event.
	var username = socket.handshake.username; // Same here, to allow event "bye" with username
	if ('undefined' === typeof clientList[sessionID]) {
		clientList[sessionID] = { "length": 0 };
		// First connection
		socket.emit('join', username, Date.now());
	}
	//clientList.push(socket.sessionId);
    clientList[sessionID]['client'] = {
        surname: username,
        data: null,
        status: "connected"
    };
	// Add connection to pool
	clientList[sessionID][socket.id] = socket;
	clientList[sessionID].length++;

    socket.broadcast.emit('message', {
        action: "userlist",
        param: getSurnameList()
    });

	socket.on('message', function(reqClient) {
		console.log("[message] Action: " + reqClient.action + " - from client " + sessionID);
		//console.log(socket);
        switch (reqClient.action) {

            case 'userlist':
                console.log("[message][userlist] Send list to client: " + sessionID);
                socket.emit('message', {
                    action: "userlist",
                    param: getSurnameList()
                });
                break;
            case 'hit':
                clientList[sessionID]['client'].data = reqClient.param;
                console.log("[message][hit] size clientList: "+clientList[sessionID].length);
                console.log("[message][hit] clientId " + sessionID + ": " +
                        "[# of bloc=" + clientList[sessionID]['client'].data.numbloc + "] " +
                        "[Level=" + clientList[sessionID]['client'].data.level + "] " +
                        "[Score=" + clientList[sessionID]['client'].data.score + "] " +
                        "[Goal=" + clientList[sessionID]['client'].data.goal + "]");
                console.log("[message][hit] Broadcast these data");
                console.log(clientList[sessionID]['client'].data);

                socket.broadcast.emit('message', {
                    action: 'bchit',
                    param: {
                        'numbloc': reqClient.param.numbloc
                    }
                });

                //socket.io.emit('this', reqClient.param);
                reqClient = null;
                break;

            default:
                console.log("[message][default] Action is '" + reqClient.action + "' is not defined");
                break;
		}
	});

	socket.on('disconnect', function() {
		// Is this socket associated to user session ?
		var userConnections = clientList[sessionID];
		if (userConnections.length && userConnections[socket.id]) {
			// Forget this socket
			userConnections.length --;
			delete userConnections[socket.id];
		}
		if (userConnections.length === 0) {
			// No more active sockets for this user: say bye
			socket.emit('bye', username, Date.now());
		}

        socket.broadcast.emit('message', {
            action: "userlist",
            param: getSurnameList()
        });
        //delete clientList[socket.sessionId];
	});
});

function getSurnameList() {
    var userListSurname = new Array();
    for (var sessionId in clientList) {
        if (clientList[sessionId]['client'].status === "connected") {
            console.log("[message] name: " + sessionId + " surname: " + clientList[sessionId]['client'].surname);
            userListSurname.push(clientList[sessionId]['client'].surname);
        }
    }
    return userListSurname;
}

/** Start server */
if (!module.parent) {
    server.listen(port, serverName, function () {
        console.log('Listening', this.address());
    });
}
