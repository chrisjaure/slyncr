var express = require('express'),
	sio = require('socket.io'),
	url = require('url'),
	crypto = require('crypto'),
	app = express.createServer(),
	socket,
	sessions = {},
	url_sessions = {},
	url_clients = {};

// -- App config ---------------------------------------------------------------
app.use('/', express.staticProvider(__dirname + '/public'));
app.use(express.bodyDecoder());
app.register('.html', require('ejs'));
app.set('view options', {
    layout: false,
    open: '<?',
    close: '?>'
});
app.set('home', 'http://cleverchris.com/slyncr');
app.set('views', __dirname + '/views');
app.listen(8000);


// -- Socket setup -------------------------------------------------------------

socket = sio.listen(app);

socket.on('connection', function(client){
	var url, session;
	client.on('message', function(data){
		console.log(data);
		if (data.substr(0, 5) == 'join:')
		{
			session = data.replace('join:', '');
			
			if (!session || !sessions[session])
			   return;
		
			sessions[session].clients.push(client);
			console.log('adding ' + session);
			broadcastCount(sessions[session].clients);
			console.log(url);
			removeClientFromUrls(client, url);
		}
		else //client sends url when it connects, we'll send back a list of sessions
		{
			url = data.split('#')[0];
			
			client.send(getSessionList(url));
			
			if (!url_clients[url])
				url_clients[url] = [];
			url_clients[url].push(client);	
			//client.url = url;
		}
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
			
			removeClientFromUrls(client, url);
			
			/*if (sessions[session].clients.length == 0)
				delete sessions[session];
			else*/
			broadcastCount(sessions[session].clients);
		}
	});
});


// -- Routes -------------------------------------------------------------------

app.get('/', function(req,res){
	res.render('page.html');
});
app.get('/generate', function(req,res){
	var shortid = getShortId(),
		session = getSessionId(shortid),
		url = req.query.url.split('#')[0],
		name = req.query.name.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
		
	sessions[session] = {
		slide: 1,
		clients: [],
		url: url,
		name: name,
		id: session,
		shortid: shortid
	};
	
	if (!url_sessions[url])
		url_sessions[url] = [];
		
	url_sessions[url].push(session);
	broadcastSessions(url);
	setSessionTimeout(sessions[session]);
	
	res.redirect(shortid);
});
app.get('/:session', function(req,res){
	var session = getSessionId(req.params.session);
	res.render('controller.html', {locals: {url: sessions[session].url, name: sessions[session].name}});
});

app.get('/next/:session', function(req,res){
	var session = sessions[getSessionId(req.params.session)];
	if (session)
	{
		session.clients.forEach(function(client){
			client.send('next');
		});
		session.slide++;
		setSessionTimeout(session);
	}
	console.log('next ' + req.params.session);
	res.send('200 OK');
});

app.get('/prev/:session', function(req,res){
	var session = sessions[getSessionId(req.params.session)];
	if (session)
	{
		session.clients.forEach(function(client){
			client.send('previous');
		});
		session.slide--;
		setSessionTimeout(session);
	}
	console.log('prev ' + req.params.session);
	res.send('200 OK');
});

// -- Utilites -----------------------------------------------------------------

function getShortId()
{
	var session = Math.round(Math.random() * 1000000).toString(36);
	if (sessions[session])
		return getShortId();
	
	return session;
}

function getSessionId(shortid)
{
	return crypto.createHash('md5').update(shortid).digest('hex');
}

function broadcastCount(clients)
{
    var count = clients.length;
    clients.forEach(function(client){
        client.send(count);
    });
}

function broadcastSessions(url)
{
	var list = getSessionList(url);
	
	if (url_sessions[url])
	{
		url_clients[url].forEach(function(client){
			client.send(list);
		});
	}
}

function removeClientFromUrls(client, url)
{
	if (url_clients[url])
	{
		url_clients[url].forEach(function(val, i){
			if (val == client)
			{
				url_clients[url].splice(i, 1);
			}
		});
	}
}

function getSessionList(url)
{
	var list = {};
	if (url_sessions[url])
	{
		url_sessions[url].forEach(function(ses_id){
			list[ses_id] = sessions[ses_id].name;
		});
	}
	console.log(url_sessions);
	return 'sessions:' + JSON.stringify(list);
}

function setSessionTimeout(session)
{
	if (session.timeout)
		clearTimeout(session.timeout);
	
	session.timeout = setTimeout(function(){
		session.clients.forEach(function(client){
			client.connection.end();
			removeClientFromUrls(client, client.url);
		});
		console.log('deleting ' + session.shortid);
		var url = session.url;
		url_sessions[url].forEach(function(val, i){
			if (val == session.id)
			{
				url_sessions[url].splice(i, 1);
			}
		});
		broadcastSessions(url);
		delete sessions[session.id];
	}, 1800000); // half-hour
}
