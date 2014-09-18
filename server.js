var config = require( './config.json' );

var irc = require( 'irc' );

var bot = new irc.Client( config.irc.server, config.irc.nick, config.irc );

bot.config = config;

module.exports = bot;

console.log('Hello!');

bot.setMaxListeners( 20 );
require('require-all')(__dirname + '/modules');
