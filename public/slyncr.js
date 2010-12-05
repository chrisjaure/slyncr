(function(){

var console = window.console;
if (!window.console)
	console = { log: function(){} };

console.log('slyncr: script loaded');

var Slyncr = {

	config: {
		server: 'cleverchris.com',
		port:8000,
		path:'/slyncr'
	},
	
	getPath: function(file)
	{
		return 'http://' + Slyncr.config.server + /*(Slyncr.config.port ? ':' + Slyncr.config.port : '') + */ Slyncr.config.path + '/' + file;
	},
	
	getScript: function(url,success)
	{
		var script = document.createElement('script'),
			head = document.getElementsByTagName('head')[0],
			done = false;
	
		script.src = url;
		script.onload = script.onreadystatechange = function(){
			if(!done && (!this.readyState || this.readyState=='loaded' || this.readyState=='complete'))
			{
				done = true;
				success();
				script.onload = script.onreadystatechange = null;
				head.removeChild(script);
			}
		};
		head.appendChild(script);
	},
	
	connect: function()
	{
		var socket = new io.Socket(Slyncr.config.server, {port: Slyncr.config.port});
		socket.connect();
		socket.on('message', function(data){
			console.log('slyncr: received ' + data);
			switch(data)
			{
				case 'next':
					Slyncr.Controller.next();
					return;
				case 'previous':
					Slyncr.Controller.previous();
					return;
			}
			
			// data could be count of connected clients or list of sessions
			if (data.substr(0, 9) == 'sessions:')
			{
				var sessions = Slyncr.Y.JSON.parse(data.replace('sessions:',''));
				Slyncr.buildMenu(sessions);
			}
			else
				Slyncr.Message.set('Joined ' + Slyncr.joining + '; ' + parseInt(data, 10) + ' connected.');
		});
		socket.on('connect', function(){
			Slyncr.Message.set('Connected!');
			setTimeout(function(){
				socket.send(window.location.href);
			}, 200);	
		});
		socket.on('disconnect', function(){
		   Slyncr.Message.set('Not connected!');
		});
		
		Slyncr.socket = socket;
	},
	
	triggerKeydown: function(key)
	{
		Slyncr.Y.Node.one('body').simulate('keydown', {keyCode: key});
	},
	
	buildMenu: function(sessions)
	{
		var Node = Slyncr.Y.Node,
			html = '<strong>Join:</strong><br>',
			count = 0;
			
		for (var ses_id in sessions) 
		{
			html += '<a class="slyncr-session" href="#'+ses_id+'">'+sessions[ses_id]+'</a>';
			count++;
		}
		
		if (count === 0)
			html += 'No session started';
				
		html += '<a id="slyncr-create-session" href="#">Create Session</a>';
		
		Slyncr.Message.set(html);
	},
	
	joinSession: function(session)
	{
		Slyncr.socket.send('join:'+session);
	},
	
	startSession: function()
	{
		var session_name = prompt('Name your session', 'Default'),
			params = '?url=' + encodeURIComponent(window.location.href) 
				+ '&name=' + encodeURIComponent(session_name);
		if (session_name)
			window.open(Slyncr.getPath('generate') + params, 'slyncr', 'location=yes,resizable=yes,width=350,height=210');
	},
	
	load: function()
	{
		Slyncr.getScript('http://yui.yahooapis.com/3.2.0/build/yui/yui-min.js', function(){
			YUI().use('node', 'get', 'node-event-simulate', 'json-parse', function(Y){
				Slyncr.Y = Y;
				Slyncr.Message.render();
				Y.Get.css(Slyncr.getPath('slyncr.css'));
				Y.Get.script(
					'http://' + Slyncr.config.server + (Slyncr.config.port ? ':' + Slyncr.config.port : '') + '/socket.io/socket.io.js',
					{onSuccess: Slyncr.connect});
			});
		});
	}
};

Slyncr.Message = (function(){
	/*var el = document.createElement('div');
	el.style.position = 'fixed';
	el.style.top = 0;
	el.style.right = 0;
	el.style.backgroundColor = '#022A61';
	el.style.color = '#ffffff';
	el.style.fontWeight = 'bold';
	el.style.padding = '5px';
	document.body.appendChild(el);*/
	
	var menu;
	
	return {
		set: function(msg)
		{
			if (menu)
			{
				menu.get('children').item(0).setContent(msg);	
			}
		},
		render: function()
		{
			var Node = Slyncr.Y.Node;
			
			menu = Node.create('<div id="slyncr-menu"><div id="slyncr-menu-inner"></div></div>');
			
			Node.one(document.body).append(menu);
			
			menu.delegate('click', function(e){
				e.preventDefault();
				Slyncr.startSession();
			}, '#slyncr-create-session');
		
			menu.delegate('click', function(e){
				e.preventDefault();
				var link = Node.one(e.target);
				Slyncr.joinSession(link.getAttribute('href').split('#')[1]);
				Slyncr.joining = link.get('text');
			}, '.slyncr-session');
		}
	}
})();

Slyncr.Controller = (function(){
	var obj;
	// branch functionality for scribd
	if (window.Scribd)
	{
		if (!window.docManager)
		{
	        //Slyncr.Message.set('Flash version of Scribd not supported!');
	        return;
		}
		
		obj = {
			next: function(){ docManager.gotoNextPage() },
			previous: function(){ docManager.gotoPreviousPage() }
		};
	}
	// 280 slides
	else if (window.CPApp)
	{
		obj = {
			next: function()
			{
				objj_msgSend(CPApp._mainWindow._contentView._subviews[0]._presentationView, "nextSlide");
			},
			previous: function()
			{
				objj_msgSend(CPApp._mainWindow._contentView._subviews[0]._presentationView, "previousSlide");
			}
		};
	}
	// simulate arrow keydown for all other sites
	else
	{
		//Slyncr.Message.set('Triggering left and right keys');
		obj = {
			next: function()
			{
				Slyncr.triggerKeydown(39);
			},
			previous: function()
			{
				Slyncr.triggerKeydown(37);
			}
		};
	}
	return obj;
})();

Slyncr.load();

})();

