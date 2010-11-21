var express = require('express'),
	sio = require('socket.io'),
	url = require('url'),
	crypto = require('crypto'),
	app = express.createServer(),
	socket,
	sessions = {};

	
// -- App config ---------------------------------------------------------------
app.use('/slyncr/', express.staticProvider(__dirname + '/public'));
app.use(express.bodyDecoder());
app.register('.html', require('ejs'));
app.set('view options', {
    layout: false,
    open: '<?',
    close: '?>'
});
app.set('home', 'http://cleverchris.com');
app.listen(8000);


// -- Socket setup -------------------------------------------------------------

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
			if (sessions[session].clients.length == 0)
				delete sessions[session];
			else
				broadcastCount(sessions[session].clients);
		}
	});
});


// -- Routes -------------------------------------------------------------------

app.get('/slyncr/', function(req,res){
	res.render('page.html');
});
app.post('/slyncr/', function(req,res){
	res.redirect('/slyncr/controller?'+getIdFromUrl(req.param('slide_url')));
});
app.get('/slyncr/controller', function(req,res){
	res.render('controller.html');
});

app.get('/slyncr/next/:session', function(req,res){
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

app.get('/slyncr/prev/:session', function(req,res){
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

// -- Utilites -----------------------------------------------------------------

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

