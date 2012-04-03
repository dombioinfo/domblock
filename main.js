var g_Domblock = null;
var g_Context = null;
var gi_LoopID;
var b_Pause = false;
var ga_ObjectList = new Array();
var BOARD_WIDTH = 560;
var BOARD_HEIGHT = 520;
var g_NbColor = 3;
var g_bGameOver = false;
var g_Level = 0;
var g_Score = 0;
var g_PointCube = 15;
var g_StayingCubeByLevel = new Array(
	0.88, // niveau 1
	0.90, // niveau 2
	0.92, // etc
	0.94,
	0.96,
	0.88, // niveau 6
	0.90, // niveau 7
	0.92, // etc
	0.94,
	0.96,
	0.88, // niveau 11
	0.90, // niveau 12
	0.92, // etc
	0.94,
	0.96
);
var g_blocPenality = 0;
var g_sessionId = null;
var g_server = "localhost";
// Create SocketIO instance, connect
var g_socket = null;

function initSocket(server) {
    if (server == null) {
        server = g_server;
    }
    
    g_socket = new io.Socket(server, {
        port: 8080,
        transports: [ 'websocket' , 'xhr-multipart', 'xhr-polling' ]
    });
    // Add a connect listener
    g_socket.on('connection', function() {
        console.log('Client has connected to the server!');
        g_sessionId = this.sessionId;
    });
    //Add a message listener
    g_socket.on('message', function(data) {
        console.debug("Received a message from the server!");
        console.debug("data: " + data);
        switch (data.action) {
            case "userlist":
                console.debug("["+data.action+"]");
                getuserlist(data.param);
                break;
            case "bchit":
                console.debug("["+data.action+"]"+JSON.stringify(data));
                console.debug("data.param.numbloc: " + data.param.numbloc);
                g_Domblock.addPenality(data.param.numbloc, DomBlock.PENALITY_MODIFY);
                refresh();
                break;
            default:
                console.warn("Action: '"+data.action+"' is not defined");
                break;
        } // switch
    });
    // Add a disconnect listener
    g_socket.on('disconnect', function() {
        console.log('The client has disconnected!');
    });
}

// Sends a message to the server via sockets
function sendMessageToServer(clientdata) {
	console.debug("Envoi d'un message au serveur : " + clientdata);
	g_socket.send(clientdata);
}
// Get user list from the server 
function getuserlist(playerList) {
	console.debug('[getuserlist] Processing user list: ' + JSON.stringify(playerList));
    console.debug("[getuserlist] nombre de sessionId : " + playerList.length);
	var userlistHTML = "";
	for (var session in playerList) {
		console.log("[getuserlist] surname: " + playerList[session]);
        userlistHTML += "<li>"+playerList[session]+"</li>\n";
	}
	document.getElementById("userlist").innerHTML = userlistHTML;
}

function run() {
	console.debug("[run] Start");
	var inputServer = document.getElementById("server");
    if (inputServer && inputServer != undefined) {
        inputServer.value = g_server;
    }

	g_Domblock = new DomBlock();
	initObject();
	
	sendMessageToServer({action: 'userlist'});
	
	// On r�cup�re l'objet canvas
	var o_Canvas = document.getElementById('boardgame');
	if (!o_Canvas || !o_Canvas.getContext) {
		return;
	}
	BOARD_WIDTH = o_Canvas.width;
	BOARD_HEIGHT = o_Canvas.height;
	
	//On r�cup�re le contexte 2D
	g_Context = o_Canvas.getContext('2d');
	if (!g_Context) {
		return;
	}
	
	// Gestion des �v�nements
	window.document.onkeydown = keyboard;
	window.document.onmousemove = myMouseMove;
	window.document.onclick = myClick;
	//window.document.onmouseover = test;
	
	// Le navigateur est compatible, le contexte a bien �t� r�cup�r�, on peut continuer...
	//gi_LoopID = setInterval(refresh, 40);
	
	console.debug("[run] Stop");
} // run 

function test(event) {
	if (event.target instanceof HTMLCanvasElement) {
		var mouseX = event.pageX - event.target.offsetLeft;
		var mouseY = event.pageY - event.target.offsetTop;
		
		console.debug("[test] mouseX: "+mouseX+", mouseY: " + mouseY);
	}
}

function initObject() {
	console.debug("[initObject] Start");

    // TODO : manage the unload event
	if (g_socket != null) {
		g_socket.disconnect();
		g_socket.connect();
	}
	
	g_Domblock.initMap(g_NbColor);
	g_Domblock.initZone();
	
	for (var i=0; i<g_Domblock.ROW; i++) {
		
		for (var j=0; j<g_Domblock.COL; j++) {
			
			var indice = i*g_Domblock.COL + j;
			ga_ObjectList[indice] = new Bloc(0, 0);
			var indexSprite = g_Domblock.map[i][j];
			//console.debug("[initObject] indexSprite = " + indexSprite);
			//console.debug("widthSprite = " + ga_ObjectList[indice].widthSprite[indexSprite]);

			if (j > 0) {
				ga_ObjectList[indice].posX = j * ga_ObjectList[indice].widthSprite[indexSprite];
			}
			if (i > 0) {
				ga_ObjectList[indice].posY = i * ga_ObjectList[indice].heightSprite[indexSprite];
			}
			
			//console.debug("[initObject] ind=" + indice + " :  [" + ga_ObjectList[indice].posX + ", " + ga_ObjectList[indice].posY +"]");
		}
	}
	
	console.debug("[initObject] Stop");
}

function refresh() {
	clearContext(g_Context, 0, BOARD_WIDTH, 0, BOARD_HEIGHT);

	//console.debug("[refresh] ga_ObjectList.length="+ga_ObjectList.length);
	
	for (var i=0; i<ga_ObjectList.length; i++) {
		var obj = ga_ObjectList[i];
		if (!b_Pause) {
			if (obj.posX + obj.dX > BOARD_WIDTH || obj.posX + obj.dX < 0) {
				obj.dX *= -1;
			}
			if (obj.posY + obj.dY > BOARD_HEIGHT || obj.posY + obj.dY < 0) {
				obj.dY *= -1;
			}
			obj.posX += obj.dX;
			obj.posY += obj.dY;
		}
		var x = Math.floor(i/g_Domblock.COL);
		var y = i%g_Domblock.COL;
		obj.display(g_Context, g_Domblock.map[x][y], ga_ObjectList[i].bHover);
	}
		
	//quit("Game over");
	if (g_bGameOver) {
		quit("Game over");
	}

} // refresh

function keyboard(event) {
	//console.debug("[keyboard] Start");
	//console.debug("Key = " + event.keyCode);
	if (event.keyCode == 39) { // Fleche de droite pr�ss�e
		
	} else if (event.keyCode == 37) { // Fleche de gauche pr�ss�e
		
	} else if (event.keyCode == 80) { // touche 'p'
		b_Pause = !b_Pause;
	} else if (event.keyCode == 81) { // touche 'q'
		// on stoppe l'animation
		quit("Quit");
	}
	refresh();
	//console.debug("[keyboard] Stop");
} // keyboard

function myMouseMove(event) {
	if (event.target instanceof HTMLCanvasElement) {
		var mouseX = event.pageX - event.target.offsetLeft;
		var mouseY = event.pageY - event.target.offsetTop;
		
		var cubeIdRow = Math.floor(mouseY / 40);
		var cubeIdCol = Math.floor(mouseX / 40);
		if (g_Domblock.map[cubeIdRow] && g_Domblock.map[cubeIdRow][cubeIdCol] && g_Domblock.map[cubeIdRow][cubeIdCol] != 0) {
			g_Domblock.initZone();
			initHover();
			g_Domblock.getZone(cubeIdRow, cubeIdCol, g_Domblock.map[cubeIdRow][cubeIdCol]);
			//console.debug("[myMouseMove] indexZone = " + g_Domblock.indexZone);
			if (g_Domblock.indexZone > 1) {
				displayScore4Zone(event);
				for (var l=0; l<=g_Domblock.indexZone; l++) {
					var index = g_Domblock.zone[l].i * g_Domblock.COL + g_Domblock.zone[l].j;
					ga_ObjectList[index].bHover = true;
					//console.debug("hover de "+index+" : " + ga_ObjectList[index].bHover);
				}
			} // if indexZone > 1
		} // if map[x][y] != 0
	}
	refresh();
	return new Array(cubeIdRow, cubeIdCol);
} // myMouseMove

function displayScore4Zone(event) {

	if (event.target instanceof HTMLCanvasElement) {
		var mouseX = event.pageX - event.target.offsetLeft;
		var mouseY = event.pageY - event.target.offsetTop;

		//console.debug("[displayScore4Zone] affiche score du bloc en position : "+mouseX + ", " + mouseY);
		// display the score of zone where mouse is pointing on
		var bonus = 0;
		bonus = g_Domblock.indexZone / (g_Domblock.COL * g_Domblock.ROW);
		g_Context.save();
		g_Context.fillStyle = "#ffffff";
		g_Context.font = "30pt Calibri";
		g_Context.fillText(g_Domblock.indexZone*Math.floor(g_PointCube*(1+bonus)), mouseX, mouseY);
		g_Context.restore();
	}

} // myMouseOver

function myClick(event) {
	var a_CoordMouse = myMouseMove(event);
    var numBloc = -1;
	if (event.target instanceof HTMLCanvasElement) {
		console.debug("[myClick] "+a_CoordMouse[0] + "; "+a_CoordMouse[1]);
		if (g_Domblock.map[a_CoordMouse[0]][a_CoordMouse[1]] != 0) {
			console.debug("[myClick] indexZone = " + g_Domblock.indexZone);
            if (g_Domblock.indexZone > 1) {
                numBloc = g_Domblock.indexZone + 1;
				var bonus = g_Domblock.indexZone / (g_Domblock.COL * g_Domblock.ROW);
				g_Score += g_Domblock.indexZone*Math.floor(g_PointCube*(1.5+bonus));
                g_Domblock.updateMap();
			}
			initHover();
			if (!g_Domblock.isContinuable()) {
				var totalCube = g_Domblock.COL * g_Domblock.ROW;
				if (g_Domblock.nbDestroyedCube < Math.floor(g_StayingCubeByLevel[g_Level] * totalCube)) {
					g_bGameOver = true;
				} else {
					g_Level++;
					g_Domblock.nbDestroyedCube = 0;
					g_NbColor += (g_Level%5==0) ? 1 : 0;
					if (g_Level == g_StayingCubeByLevel.length) {
						quit("End");
						return(this);
					}
					run();
				}
			} // if !isContinuable
            updatePane(numBloc);
            refresh();
		} // if map[x][y] != 0
	} // if HTMLCanvasElement
    return null;
} // myClick

function clearContext(ctx, startwidth, ctxwidth, startheight, ctxheight) {
	ctx.clearRect(startwidth, startheight, ctxwidth, ctxheight);
} // clearContext

function quit(sz_Msg) {
	clearInterval(gi_LoopID);
	var sizeChar = 24;
	var i_MsgWidth = sz_Msg.length*sizeChar + 60;
	var i_MsgHeight = 80;
	var i_MsgPosX = Math.floor((BOARD_WIDTH - i_MsgWidth)/2);
	var i_MsgPosY = Math.floor((BOARD_HEIGHT - i_MsgHeight)/2);
	g_Context.save();
	g_Context.translate(i_MsgPosX, i_MsgPosY);
	clearContext(g_Context, 0, i_MsgWidth, 0, i_MsgHeight);
	g_Context.fillStyle = "#333333";
	g_Context.fillRect(0, i_MsgWidth, 0, i_MsgHeight);
	g_Context.fillStyle = "#000000";
	g_Context.font = "36pt Calibri";
	g_Context.fillText(sz_Msg, i_MsgWidth/2-(sz_Msg.length/2)*sizeChar, i_MsgHeight/2+10);
	g_Context.beginPath();
	g_Context.rect(0, 0, i_MsgWidth, i_MsgHeight);
	//g_Context.strokeStyle = "#8ED6FF";
	g_Context.lineWidth = 2;
    g_Context.stroke();
	g_Context.restore();
} // quit

function initHover() {
	for (var i=0; i<ga_ObjectList.length; i++) {
		ga_ObjectList[i].bHover = false;
	}
}

function updatePane(numBloc) {
	document.getElementById("level").innerHTML = (g_Level + 1);
	document.getElementById("score").innerHTML = g_Score;
	var totalCube = g_Domblock.COL * g_Domblock.ROW;
	var goal = g_Domblock.nbDestroyedCube + "/" + Math.floor(g_StayingCubeByLevel[g_Level] * totalCube);
	document.getElementById("goal").innerHTML = goal;
	
	if (g_socket != null) {

        var message = {
            action: 'hit',
            param: {
                "numbloc": numBloc,
                "level": (g_Level + 1),
                "score": g_Score,
                "goal": goal
            }
		};
		console.debug("[updatePane] message: " + JSON.stringify(message));
        sendMessageToServer(message);
	}
}

function updateServer(objId) {
    g_server = document.getElementById(objId).value;
    if (g_server && g_server != undefined) {
        initSocket(g_server);
    }
}

initSocket(g_server);
window.addEventListener('load', run, false);
window.addEventListener('beforeunload ', g_socket.disconnect, false);
