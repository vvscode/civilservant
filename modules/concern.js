/**
 * concern.js
 *
 * !concern
 * Toggles whether the bot should interrupt charged conversations
 * with an unhelpful message.
 */
var bot = require( '..' );
var isEmotional = require( 'emotional_alert' );
var nox = false;
var verbose = false; // TODO: cvar

bot.addListener( 'message', function ( nick, to, text ) {
	if ( !nox ) {
		var x = isEmotional( text );
		if ( x.emotional) {
			if ( x.winner ) {
				var adj = {
					0: '',
					1: 'slightly ',
					2: 'rather ',
					3: 'quite ',
					4: 'very ',
					5: 'extremely ',
					6: 'copiously ',
					7: 'agonizingly '
				};
				x.adj = adj[x.emotional] === undefined ? 'a tad ' : adj[x.emotional];
				switch (x.winner) {
					case 'anger':
						x.hwinner = 'angry';
						break;
					case 'stress':
						x.hwinner = 'stressed';
						break;
					case 'sad':
						/* falls through */
					default:
						x.hwinner = x.winner;
				}

				bot.say( to, nick + ': you seem ' + x.adj + x.hwinner + ' (score: ' + x.emotional + ')');
			} else {
				// danger phrase
				if ( verbose ) {
					bot.say( to, nick + ': that is a worrying thing to say' );
				}
			}
		}
	}
	if ( text === '!concern' ) {
		if ( !nox ) {
			nox = true;
			bot.say( to, nick + ': adopting air of unconcern' );
		} else {
			nox = false;
			bot.say( to, nick + ': concerning myself with matters' );
		}
	}
} );
