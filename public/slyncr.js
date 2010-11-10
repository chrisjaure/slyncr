(function(){

var config = {
	server: 'cleverchris.com',
	port: 8000
};

function getScript(url,success){
	var script = document.createElement('script'),
		head = document.getElementsByTagName('head')[0],
		done = false;
	
	script.src = url;
	script.onload = script.onreadystatechange = function(){
		if(!done && (!this.readyState || this.readyState=='loaded' || this.readyState=='complete'))
		{
			done=true;
			success();
			script.onload = script.onreadystatechange = null;
			head.removeChild(script);
		}
	};
	head.appendChild(script);
}

if (typeof console !== 'undefined')
	console.log('slyncr loaded');

var Controller = (function(){

	if (typeof Scribd !== 'undefined')
	{
		var obj = {
			next: function(){ docManager.gotoNextPage() },
			previous: function(){ docManager.gotoPreviousPage() },
			id: function(){
				var url = window.location.pathname.split('/');
				return 'scribd+'+url[2]+'+'+url[3];
			}
		};
		return obj;
	}	
	else if (typeof CPApp !== 'undefined')
	{
		var obj = {
			next: function(){
				objj_msgSend(CPApp._mainWindow._contentView._subviews[0]._presentationView, "nextSlide");
			},
			previous: function(){
				objj_msgSend(CPApp._mainWindow._contentView._subviews[0]._presentationView, "previousSlide");
			},
			id: function(){
				var url = window.location.search.substr(1).split('?'),
					str = "280slides";
				for (var i = 0, params; i < url.length; i++)
				{
					params = url[i].split('=');
					if (params[0] == 'user' || params[0] == 'name')
						str += '+' + params[1];
				}
				return str;
			}
		};
		return obj;
	}

})();

getScript('http://' + config.server + (config.port ? ':' + config.port : '') + '/Socket.IO/socket.io.js', function(){
	var socket = new io.Socket(config.server, {port: config.port});
	socket.connect();
	socket.on('message', function(data){
		switch(data)
		{
			case 'next':
				Controller.next();				
				break;
			case 'previous':
				Controller.previous();
				break;
		}
	});
	socket.on('connect', function(){
		//console.log('socket connected');
		setTimeout(function(){
			socket.send(Controller.id());
		}, 200);	
	});
	socket.on('close', function(){
		//console.log('close');
	});
});

})();
