(function(){

var console = window.console;
if (!window.console)
	console = { log: function(){} };

console.log('slyncr: script loaded');

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
			done = true;
			success();
			script.onload = script.onreadystatechange = null;
			head.removeChild(script);
		}
	};
	head.appendChild(script);
}

var Message = {
    el: null,
    create: function(){
        this.el = document.createElement('div');
        this.el.style.position = 'fixed';
        this.el.style.top = 0;
        this.el.style.right = 0;
        this.el.style.backgroundColor = '#022A61';
        this.el.style.color = '#ffffff';
        this.el.style.fontWeight = 'bold';
        this.el.style.padding = '5px';
        document.body.appendChild(this.el);
    },
    set: function(msg){
        this.el.innerHTML = msg;
        console.log('slyncr: ' + msg);
    }
};

Message.create();

var Controller = (function(){
	// branch functionality for scribd
	if (window.Scribd)
	{
	    if (!window.docManager)
	    {
            Message.set('Flash version of Scribd not supported!');
            return;
	    }
	    
		var obj = {
			next: function(){ docManager.gotoNextPage() },
			previous: function(){ docManager.gotoPreviousPage() }
		};
		return obj;
	}
	// 280 slides
	else if (window.CPApp)
	{
		var obj = {
			next: function(){
				objj_msgSend(CPApp._mainWindow._contentView._subviews[0]._presentationView, "nextSlide");
			},
			previous: function(){
				objj_msgSend(CPApp._mainWindow._contentView._subviews[0]._presentationView, "previousSlide");
			}
		};
		return obj;
	}
	else
	{
	    Message.set('Site not supported!');
	}

})();

if (!Controller)
{
    return;
}

getScript('https://github.com/LearnBoost/Socket.IO/raw/master/socket.io.js', function(){
	var socket = new io.Socket(config.server, {port: config.port});
	socket.connect();
	socket.on('message', function(data){
		console.log('slyncr received ' + data);
		switch(data)
		{
			case 'next':
				Controller.next();
				break;
			case 'previous':
				Controller.previous();
				break;
			default:
			    // default is a count of connected clients
			    Message.set(parseInt(data, 10) + ' connected.');
		}
	});
	socket.on('connect', function(){
		Message.set('Connected!');
		setTimeout(function(){
			socket.send(window.location.href);
		}, 200);	
	});
	socket.on('disconnect', function(){
	   Message.set('Not connected!');
	});
});

})();

