var http = require('http')
, url = require('url')
, fs = require('fs')
, io = require('./plugins/socket.io')
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
            console.log("[switch 1/2] " + regex[2] + " : " + path);
			fs.readFile(__dirname + path, function(err, data){
				if (err) return send404(res);
				res.writeHead(200, {'Content-Type': path.match("/*.js/") ? 'text/javascript' : 'text/html'});
				res.write(data, 'utf8');
				res.end();
			});
			break;
		case regex[3].test(path):
            console.log("[switch 3] " + regex[3] + " : " + path);
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
io = io.listen(server);

var clientList = new Array();

io.on('connection', function(socket) {
	//console.log(socket);
	// now we have a client object!
	console.log("Connection accepted.");

	//clientList.push(socket.sessionId);
    clientList[socket.sessionId] = {
        surname: "Player"+ (clientList.length++),
        data: null,
        status: "connected"
    };
    socket.broadcast({
        action: "userlist",
        param: getSurnameList()
    });

	socket.on('message', function(reqClient) {
		console.log("[message] Action: " + reqClient.action + " - from client " + socket.sessionId);
		switch (reqClient.action) {

            case 'userlist':
                console.log("[message][userlist] Send list to client: " + socket.sessionId);
                socket.send({
                    action: "userlist",
                    param: getSurnameList()
                });
                break;
            case 'hit':
                clientList[socket.sessionId].data = reqClient.param;
                console.log("[message][hit] size clientList: "+clientList.length);
                console.log("[message][hit] clientId " + socket.sessionId + ": " +
                        "[# of bloc=" + clientList[socket.sessionId].data.numbloc + "] " +
                        "[Level=" + clientList[socket.sessionId].data.level + "] " +
                        "[Score=" + clientList[socket.sessionId].data.score + "] " +
                        "[Goal=" + clientList[socket.sessionId].data.goal + "]");
                console.log("[message][hit] Broadcast these data");

                socket.broadcast({
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
		console.log("[disconnect] Connected " + socket.sessionId + " terminated.");
        if (clientList[socket.sessionId].status == "connected") {
            clientList[socket.sessionId].status = null;
        }
        socket.broadcast({
            action: "userlist",
            param: getSurnameList()
        });
        //delete clientList[socket.sessionId];
	});
});

function getSurnameList() {
    var userListSurname = new Array();
    for (var sessionId in clientList) {
        if (clientList[sessionId].status == "connected") {
            console.log("[message] name: " + sessionId + " surname: " + clientList[sessionId].surname);
            userListSurname.push(clientList[sessionId].surname);
        }
    }
    return userListSurname;
}
