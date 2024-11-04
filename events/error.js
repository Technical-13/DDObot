const client = require( '..' );
const chalk = require( 'chalk' );

client.on( 'error', err => {
	console.error( chalk.cyan.inverse.bold( `An unhandled error has occured [${err.code}]: ${err.message}\n${err}` ) );
} );