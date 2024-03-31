const bot = ( process.env.BOT_USERNAME ?? 'bot' );
const express = require( 'express' );
const replServer = express();
const objTimeString = require( '../time.json' );
var strNow = () => { return ( new Date() ).toLocaleDateString( 'en-us', objTimeString ) };


replServer.all( '/', ( req, res ) => { res.send( bot + ' was last restarted: ' + strNow() ); } );

function keepAlive() {
  var server = replServer.listen( 3000, () => {
    const port = server.address().port;
    console.log( 'Port %s is ready to host %s.', port, bot );
  } );
}

module.exports = keepAlive;
