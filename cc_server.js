var http = require('http')
, url = require('url')
, fs = require('fs')
, io = require('socket.io')
, server;

server = http.createServer(function(req, res){
	// your normal server code
	var path = url.parse(req.url).pathname;
	var regex = new Array(
		new RegExp("/$"),
		new RegExp("/*.html"),
		new RegExp("/*.js"),
		new RegExp("/*.png")
	);
	
	switch (true) {
		case regex[0].test(path):
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('<h1>Hello! Try the <a href="/index.php">DomBlock</a></h1>');
			res.end();
			break;
		case regex[1].test(path):
		case regex[2].test(path):
			fs.readFile(__dirname + path, function(err, data){
				if (err) return send404(res);
				res.writeHead(200, {'Content-Type': path.match("/*.js/") ? 'text/javascript' : 'text/html'});
				res.write(data, 'utf8');
				res.end();
			});
			break;
		case regex[3].test(path):
			fs.readFile(__dirname + path, function(err, data){
				if (err) return send404(res);
				res.writeHead(200, {'Content-Type': 'image/png'});
				res.write(data);
				res.end();
			});
			break;
		default:
			send404(res);
			break;
	}
}),

send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
};

server.listen(8080);

// socket.io, I choose you
var io = io.listen(server);

var clientList = new Array();

io.on('connection', function(socket) {
	//console.log(socket);
	// now we have a client object!
	console.log("Connection accepted.");
	clientList.push('"'+socket.sessionId+'":'+socket+'');
	
	socket.on('message', function(clientdata) {
		console.log("Recieved message: " + clientdata + " - from client " + socket.sessionId);
		if (clientdata === 'getuserlist') {
			console.log("send list to client: " + socket.sessionId);
			var data = {"getuserlist": clientList};
			socket.send(JSON.stringify(data));
		} else {
			clientList["'"+socket.sessionId+"'"] = clientdata;
			console.log("client " + socket.sessionId + ": " +
					"[Num bloc=" + clientList["'"+socket.sessionId+"'"]["numbloc"] + "] " +
					"[Level=" + clientList["'"+socket.sessionId+"'"]["level"] + "] " +
					"[Score=" + clientList["'"+socket.sessionId+"'"]["score"] + "] " +
					"[Goal=" + clientList["'"+socket.sessionId+"'"]["goal"] + "]");
			console.log("Broadcast these data");
			socket.broadcast(clientdata);
			clientdata = null;
		}
	});

	socket.on('disconnect', function() {
		console.log("Connected " + socket.sessionId + "terminated.");
	});
});
