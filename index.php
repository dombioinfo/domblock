<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html style="width:100%;margin:0;padding:0;">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
	<title>DomBlock</title>
	<!-- <script src="http://www.html5canvastutorials.com/libraries/kinetic2d-v1.0.0.js"></script> -->
	<script src="http://jqueryjs.googlecode.com/files/jquery-1.2.6.min.js" type="text/javascript"></script>
	<script src="http://cdn.socket.io/stable/socket.io.js"></script>
	<!-- <script type="text/javascript" src="/socket.io/socket.io.js"></script> -->
	<script type="text/javascript" src="/domblock.js"></script>
	<script type="text/javascript" src="/objects.js"></script>
	<script type="text/javascript" src="/main.js"></script>
</head>
<body style="text-align: center; background: #5A5A5A; width: 100%;">
	<canvas id="boardgame" width="560" height="520" style="margin-right: auto; margin-left: auto;background:#050505; margin: 5px; float:left; border:1px solid black;">
		Your browser doesn't support HTML5
	</canvas>
	<div style="float: left">
		<fieldset style="width: 6em;margin-top:3px;background:#f9f9f9"><legend style="margin:0px 4px;background:#f9f9f9">Level/Goal</legend>
			<div id="level"></div>
			<hr/>
			<div id="goal"></div>
		</fieldset>
		<fieldset style="width: 6em;margin-top:3px;background:#f9f9f9"><legend style="margin:0px 4px;background:#f9f9f9">Score</legend>
			<div id="score"></div>
		</fieldset>
		<fieldset style="width: 6em;margin-top:8px;background:#f9f9f9;">
			<a href="" onclik="run();">New game</a>
		</fieldset>
		<fieldset style="width: 6em;margin-top:3px;background:#f9f9f9"><legend style="margin:0px 4px;background:#f9f9f9">User list</legend>
			<ul id="userlist"></ul>
		</fieldset>
	</div>
</body>
</html>