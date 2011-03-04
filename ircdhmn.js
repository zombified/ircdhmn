if( typeof String.prototype.trim !== 'function' ) 
{
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, ''); 
	}
}



var sys = require('sys');
var irc = require('irc-js');

var freenode_options = { server: 'irc.freenode.net', nick: 'dhmn43200',
								user: { username: 'dhmn43200', hostname: 'dhmn.net', servername: 'dhmnjk', realname:'dhmn43200'} };
var esper_options = { server: 'irc.esper.net', nick: 'dhmn43201', pass:'d4m0n',
								user: { username: 'dhmn43201', hostname: 'dhmn.net', servername: 'dhmnjk', realname:'dhmn43201'} };

var freebot = new irc( freenode_options );
var esperbot = new irc( esper_options );

var freebot_ready = false;
var esperbot_ready = false;

var do_echo = false;


function botready( botname )
{
	if( botname == 'freebot' ) { freebot_ready = true; }
	else if( botname == 'esperbot' ) { esperbot_ready = true; }

	do_echo = freebot_ready && esperbot_ready;
}

function freebot_listener( msg )
{
	command_dispatch( esperbot, esper_options, freebot, freenode_options, '(freenode) ', '(esper) ', msg );
}

function esperbot_listener( msg )
{
	command_dispatch( freebot, freenode_options, esperbot, esper_options, '(esper) ', '(freenode) ', msg );
}

function echo_to( tobot, msg, prefix )
{
	if( !do_echo || msg.person.nick == freenode_options.nick || msg.person.nick == esper_options.nick ) { return; }

	tobot.privmsg( '#dhmn', prefix + msg.person.nick + '> ' + msg.params.slice( -1 ).toString() );
}

function command_dispatch( to, toOpt, from, fromOpt, outprefix, inprefix, msg )
{	
	var msgtext = msg.params.slice( -1 ).toString();
	var prefix = fromOpt.nick + ':';
	
	if( msgtext.substr(0, prefix.length) == prefix )
	{
		var command = msgtext.substr(prefix.length).trim().toLowerCase();
		switch( command )
		{
			case 'yes' :
				from.privmsg('#dhmn', 'Good. Very good.');
				break;

			case 'no' :
				from.privmsg('#dhmn', 'Tsk. Tsk.');
				break;

			case 'ls' :
				to.names('#dhmn', function( channel, names ) {
					from.privmsg('#dhmn', inprefix + names.join(', '));
				});
				break;
		}
	}
	else
	{
		echo_to( to, msg, outprefix );
	}
}



freebot.addListener( 'privmsg', freebot_listener );
esperbot.addListener( 'privmsg', esperbot_listener );




freebot.connect(function() {
	setTimeout( function() {
		freebot.join('#dhmn');
		botready('freebot');
	}, 5000 );
});

esperbot.connect(function() {
	esperbot.listenOnce( 'ping', function() {
		setTimeout( function() { 
			esperbot.join('#dhmn'); 
			botready('esperbot'); 
		}, 5000 );
	});
});
