var express = require('express'),
	sio = require('socket.io'),
	url = require('url'),
	crypto = require('crypto'),
	app = express.createServer(),
	socket,
	sessions = {};
	

app.use(express.staticProvider(__dirname + '/public'));

app.listen(8000);

socket = sio.listen(app);

socket.on('connection', function(client){
	var params, session;
	client.on('message', function(slide_url){
	    session = getIdFromUrl(slide_url);
	    
	    if (!session)
	       return;
	    
		if (!sessions[session])
			sessions[session] = {
				slide: 1,
				clients: []
			};
		
		sessions[session].clients.push(client);
		console.log('adding ' + session);
		broadcastCount(sessions[session].clients);
	});
	client.on('disconnect', function(){
		if (sessions[session])
		{
			sessions[session].clients.forEach(function(val, i){
				if (val == client)
				{
					sessions[session].clients.splice(i, 1);
					console.log('removing ' + session);
				}
			});
			broadcastCount(sessions[session].clients);
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

function getIdFromUrl(path)
{
    return crypto.createHash('md5').update(path.split('#')[0]).digest('hex');
}

function broadcastCount(clients)
{
    var count = clients.length;
    clients.forEach(function(client){
        client.send(count);
    });
}

