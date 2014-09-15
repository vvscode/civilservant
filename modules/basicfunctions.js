var bot = require( '..' );

bot.addListener( 'message', function ( nick, to, text ) {
	if ( text.substr( 0, 4 ) === '!say' ) {
		bot.notice( to, text.substr( text.indexOf( ' ' ) + 1 ) );
	} else if ( text.substr( 0, 4 ) === '!src' ) {
		bot.notice( to, nick + ' : https://github.com/zuzakistan/civilservant' );
	} else if ( text.substr( 0, 5 ) === '!quit' ) {
		if ( to === bot.config.irc.channel ) {
			process.exit( 0 );
		} else {
			console.log( '!quit attempted by ' + nick + ' in ' + to  + ' (ignoring)');
		}
	} else if ( text === '!postcode' ) {
		bot.say( to, nick + ': OX26 2FY' );
	}
} );
