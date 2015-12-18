/**
 * bbcbreaking.js
 *
 * Parses the BBC News homepage ticker and reports breaking news when
 * it occurs.
 *
 * !news
 * Toggles the news feed (globally) on and off.
 *
 * !news corrections
 * Outputs the link to the BBC contact pages.
 *
 * !news status
 * Returns the current status of the BBC news feed
 *
 * !news wipe
 * Purges the cache of stale news stories.
 * This may cause a large number of stories to be retransmitted.
 * [Control channel only.]
 */
var client = require( '..' );
var schedule = require( 'node-schedule' );
var request = require( 'request' );
var _ = require( 'underscore' );
var Bitly = require( 'bitly' );
var slack = require('slack-notify')('https://' + client.config.slack.org + '.slack.com/services/hooks/incoming-webhook?token=' + client.config.slack.token );
var fs = require( 'fs' );

var stale = require( __dirname + '/../data/stale.json' );
var stale2 = [];

var bitly = new Bitly( client.config.bitly.username, client.config.bitly.password );

var pulserule= new schedule.RecurrenceRule();
pulserule.second = [0,30];
var nox = false;

function articlePending() {
	var article = [
		'article',
		'column',
		'details',
		'feature',
		'news',
		'page',
		'report'
	];
	var pending = [
		'coming',
		'in abeyance',
		'in progress',
		'not yet available',
		'pending',
		'unfinished',
		'unpublished',
		'waiting'
	];
	return [
		article[Math.floor( Math.random() * article.length )],
		pending[Math.floor( Math.random() * pending.length )]
	];
}

function toTitleCase( str ) {
	return str.replace( /\w\S*/g, function ( txt ) {
		return txt.charAt( 0 ).toUpperCase() + txt.substr( 1 ).toLowerCase();
	} );
}
function constructStorage( item ) {
	var ret = item.headline + '%' + item.url + '%' + item.isBreaking.toString();
	return ret + '%' + item.prompt;
}

schedule.scheduleJob( pulserule, function () {
	request( 'http://www.bbc.co.uk/news/10284448/ticker.sjson', function( err, res, body ) {
		if ( err ) {
			console.log( err.message );
		} else {
			try {
				var data = JSON.parse( body );
				data.entries.forEach( function ( item ) {
					if ( !_.contains( stale, constructStorage( item ) ) ) {
						stale.push( constructStorage( item ) );
						fs.writeFile( __dirname + '/../data/stale.json', JSON.stringify( stale, null, 4 ) );
						var msg = '';
						var len = item.prompt.length;
						var color = 0;
						if ( item.isBreaking === 'true' ) {
							msg += '\x1F';
							if ( item.prompt.indexOf( 'BREAKING' ) !== -1 ) {
								msg += '\u00035';
							} else {
								for ( var i = 0; i < len; i++ ) {
									color += item.prompt.charCodeAt( i );
								}
								color = color % 15;
								if ( color === 5 ) {
									color = 10;
								}
								msg += '\u0003' + color;
							}
							msg += item.prompt;
							msg += ':\x0F';
							if ( !_.contains( stale2, item.url ) && !_.contains( stale2, item.headline ) ) {
								stale2.push( item.url );
								stale2.push( item.headline );
								msg += '\u0003 \u0002'; // white (so breaking stands out)
							} else {
								msg += '\u0003 ';
							}
						} else {
							for ( var j = 0; j < len; j++ ) {
								color += item.prompt.charCodeAt( j );
							}
							color = color % 15;
							if ( color === 5 ) {
								color = 10;
							}
							msg += '\u0003' + color + item.prompt + ':';
							msg += '\u0003 '; // cancel coloring
						}
						msg += item.headline;
						bitly.shorten( item.url, function ( err, response ) {
							if ( err ) {
								msg += item.url;
							} else if ( response.data.url !== undefined ) {
								msg += ' ' + response.data.url;
								var meta = [];
								if ( item.isLive === 'true' ) { // must be string
									meta.push( 'live' );
								}
								if ( item.mediaType !== 'Standard' ) {
									meta.push( item.mediaType.toLowerCase() );
								}
								if ( meta.length !== 0 ) {
									msg += ' \u000313(' + meta.join( ' ' ) + ')\u0003';
								}
							} else {
								msg += ' \u00031<' + articlePending().join( ' ' ) + '>';
							}
							if ( !nox ) {
								client.notice(client.config.irc.control, msg);
							}
						} );
						slack.send( {
							channel: '#news',
							icon_url: 'https://i.imgur.com/Ikxp2g7.png',
							text: item.url ? '<' + item.url + '|' + item.headline + '>' : item.headline,
							username: 'BBC ' + toTitleCase( item.prompt ),
							color: item.isBreaking ? '#990000' : null,
							unfurl_links: true
						} );
					}
				} );
			} catch ( e ) {
				return;
			}
		}
	} );
} );

client.addListener( 'message', function ( nick, to, text ){
	if ( text === '!news' ) {
		if ( nox === false ) {
			nox = true;
			client.say( to, nick + ': BBC News feed silenced.' );
		} else {
			nox = false;
			client.say( to, nick + ': BBC News feed started.' );
		}
	} else if ( text === '!news corrections' ) {
		client.say( to, nick + ': http://www.bbc.co.uk/news/21323537' );
	} else if ( text === '!news status' ) {
		if ( nox === false ) {
			client.say( to, nick + ': BBC News feed is active.' );
		} else if ( nox === true ) {
			client.say( to, nick + ': BBC News feed is silenced.' );
		} else {
			client.say( to, nick + ': BBC News feed is buggered.' );
		}
	} else if ( text === '!news wipe' ) {
		if ( to === client.config.irc.control ) {
			stale = [];
			fs.writeFileSync( __dirname + '../data/stale.json', JSON.stringify( stale, null, 4 ) );
			client.say( to, nick + ': wiped history (brace for impact)' );
		} else {
			client.say( to, nick + ': you are not allowed to do that.' );
		}
	} else if ( text === '!news count' ) {
		client.say( to, nick + ': ' + stale.length.toLocaleString( 'en' ) + ' entries in memory' );
	}
} );


