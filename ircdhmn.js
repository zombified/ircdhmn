var sys = require('sys');
var irc = require('irc-js');



// add trim method to String object -- removes white space from both the left and right of a string
if( typeof String.prototype.trim !== 'function' ) 
{
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, ''); 
	}
}


// connection options
var freenode = {
	bot: 0,
	opt: { server: 'verne.freenode.net', nick: 'ircdhmn' },
	prefix: '(fn) ',
	ready: false,
};
var espernet = {
	bot: 0,
	opt: { server: 'irc.esper.net', nick: 'ircdhmn' },
	prefix: '(en) ',
	ready: false,
};

freenode.bot = new irc( freenode.opt );
espernet.bot = new irc( espernet.opt );

var do_echo = false;


// list of command objects -- each object contains 2 properties: a regex value used to test against 
// a command, and a operation function that gets executed if the test is a match
//
// op: function( orig, dest, rawmsg, cmd )
//		orig: object representing the origin of the command, has the following properties:
//			bot: the IRC object that handles communication with the IRC server
//			opt: the options object associated with the bot
//			prefix: a string identifying the bot's irc channel
//		dest: object with same format as the orig parameter, except it represents the destination
//		rawmsg: this is the message object as created in the IRC-js module
//		cmd: this is the command text which was parsed out of the message text
//		matches: this is the result of executing the test regex against the cmd
//
var commands = [
	{
		test: /^\s*yes\s*$/i,
		op: function( orig, dest, rawmsg, cmd, matches ) { 
				say( [orig.bot, dest.bot], '#dhmn', 'Good. Very good.' );
			},
	},
	{
		test: /^\s*no\s*$/i,
		op: function( orig, dest, rawmsg, cmd, matches ) { 
				say( [orig.bot, dest.bot], '#dhmn', 'Tsk. Tsk.' );
			},
	},
	{
		test: /^\s*src\s*$/i,
		op: function( orig, dest, rawmsg, cmd, matches ) {
				say( [orig.bot, dest.bot], '#dhmn', 'https://github.com/zombified/ircdhmn' );
			},
	},
	{
		test: /^\s*ls\s*$/i,
		op: function( orig, dest, rawmsg, cmd, matches ) {
				dest.bot.names('#dhmn', function( channel, names ) {
					orig.bot.privmsg('#dhmn', dest.prefix + names.join(', '));
				});
			},
	},
	{
		test: /^\s*agree with (.*)\s*$/i,
		op: function( orig, dest, rawmsg, cmd, matches ) {
				if( matches.length > 1 )
				{
					if( matches[1].trim().toLowerCase() == 'me' )
					{
						say( [orig.bot, dest.bot], '#dhmn', 'I agree with you, ' + rawmsg.person.nick );
					}
					else
					{
						say( [orig.bot, dest.bot], '#dhmn', 'I agree with ' + matches[1] );
					}
				}
			},
	},
];



function botready( botname )
{
	if( botname == 'freenode' ) { freenode.ready = true; }
	else if( botname == 'espernet' ) { espernet.ready = true; }

	do_echo = freenode.ready && espernet.ready;
}

function freenode_listener( msg )
{
	command_dispatch( freenode, espernet, msg );
}

function espernet_listener( msg )
{
	command_dispatch( espernet, freenode, msg );
}

// sends the same message to the given list of IRC-js objects
function say( bots, to, msg )
{
	for( var i = 0; i < bots.length; i++ )
	{
		bots[i].privmsg( to, msg );
	}
}

function echo( orig, dest, msg )
{
	if( !do_echo ) { return; } // || msg.person.nick == freenode.opt.nick || msg.person.nick == espernet.opt.nick ) { return; }

	dest.bot.privmsg( '#dhmn', orig.prefix + msg.person.nick + '> ' + msg.params.slice( -1 ).toString() );
}

function command_dispatch( orig, dest, msg )
{
	var msgtext = msg.params.slice( -1 ).toString();
	var prefixre = new RegExp(orig.opt.nick + ':(.*)');
	var prefixmatch = prefixre.exec(msgtext);

	// if someone types in 'ircdhmn:' then it is considered a command, and should be handled as such
	if( prefixmatch != null && prefixmatch.length > 1 )
	{
		var cmdmatch;
		for( var i = 0; i < commands.length; i++ )
		{
			cmdmatch = commands[i].test.exec(prefixmatch[1]);
			if( cmdmatch != null )
			{
				commands[i].op( orig, dest, msg, prefixmatch[1], cmdmatch );
			}
		}
	}
	else
	{
		echo( orig, dest, msg );
	}
}



freenode.bot.addListener( 'privmsg', freenode_listener );
espernet.bot.addListener( 'privmsg', espernet_listener );

freenode.bot.connect(function() {
	setTimeout( function() {
		freenode.bot.join('#dhmn');
		botready('freenode');
	}, 5000 );
});

espernet.bot.connect(function() {
	espernet.bot.listenOnce( 'ping', function() {
		setTimeout( function() { 
			espernet.bot.join('#dhmn'); 
			botready('espernet'); 
		}, 5000 );
	});
});
