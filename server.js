var express = require('express'),
	sio = require('socket.io'),
	url = require('url'),
	querystring = require('querystring'),
	app = express.createServer(),
	socket,
	sessions = {};
	
app.configure(function(){
	app.use(express.staticProvider(__dirname + '/public'));
});

app.listen(8000);

socket = sio.listen(app);

socket.on('connection', function(client){
	var params, session;
	client.on('message', function(session){
		if (!sessions[session])
			sessions[session] = {
				slide: 1,
				clients: []
			};
		
		sessions[session].clients.push(client);
		console.log('adding ' + session);
	});
	client.on('disconnect', function(){
		if (sessions[session])
		{
			sessions[session].clients.forEach(function(val, i){
				if (val == client)
				{
					delete sessions[session].clients[i];
					console.log('removing ' + session);
				}
			});
		}
	});
});

app.get('/next/:session', function(req,res){
	var session = sessions[req.params.session];
	if (session)
	{
		session.clients.forEach(function(client){
			client.send('next');
		});
		session.slide++;
	}
	console.log('next ' + req.params.session);
	res.send('200 OK');
});

app.get('/prev/:session', function(req,res){
	var session = sessions[req.params.session];
	if (session)
	{
		session.clients.forEach(function(client){
			client.send('previous');
		});
		session.slide--;
	}
	console.log('prev ' + req.params.session);
	res.send('200 OK');
});
