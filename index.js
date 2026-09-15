/**
 * @file index.js
 * @description Core entry point and initialization engine for DDObot "error-of-demogorgon" (v3).
 * Responsible for loading environment configurations, initializing the MongoDB persistence layer,
 * instantiating the Discord client with necessary intents/partials, and booting modular handlers.
 *
 * @project DDObot "error-of-demogorgon" (v3)
 * @see {@link  https://github.com/Technical-13/DDObot/tree/error-of-demogorgon | GitHub Repository Branch}
 *
 * @author Technical-13
 * @see {@link https://github.com/Technical-13 | Technical-13 (GitHub)}
 * @see {@link https://discord.com/users/440752068509040660/ | MagentaRV (Discord)}
 * @see {@link https://ddowiki.com/page/User:Technical_13 | Technical_13 (DDOwiki)}
 * @see {@link https://forums.ddo.com/index.php?members/shoemaker.2824/ | ShoeMaker (DDO Forums)}
 *
 * @license GNU-3
 *
 * @requires dotenv
 * @requires discord.js
 * @requires chalk
 * @requires fs
 */
const modData = { name: 'index' };
require( 'dotenv' ).config();
const { EventEmitter } = require( 'events' );
const buildPath = require( './functions/buildPath.js' );
const corePath = {
  config: buildPath( { ext: 'json', name: 'config' } ),
  db: buildPath( { name: 'initialize', platform: 'mongodb' } ),
  discord: buildPath( { name: 'clientDiscord', type: 'functions' } ),
  Err: buildPath( { name: 'Err', type: 'functions' } ),
  timeFormat: buildPath( { ext: 'json', name: 'time', type: 'jsonObjects' } ),
  webDash: buildPath( { name: 'server', platform: 'webDashboard' } )
};
const bot = {
  ascii: require( 'ascii-table' ),
  buildPath: buildPath,
  chalk: require( 'chalk' ),
  config: require( corePath.config ),
  djs: require( 'discord.js' ),
  env: process.env,
  Err: require( corePath.Err ),
  events: new EventEmitter(),
//  express: require( 'express' ),
  fs: require( 'fs' ),
  mongoose: require( 'mongoose' ),
//  rest: require( '@discordjs/rest' ),
  timeFormat: require( corePath.timeFormat )
};
bot.events.setMaxListeners( 100 );
module.exports = bot;

const { chalk, env, fs } = bot;
const strScript = chalk.hex( '#FFA500' ).bold( buildPath( modData ) );// TEMPORARY --- WILL BE IN ERROR HANDLER LATER

require( corePath.db )().then( () => {
  console.log( 'Database initialization sequence completed successfully.' );
  const discord = require( corePath.discord );
  if ( !discord ) {
    console.error( 'Failed to initialize Discord client in %s.', strScript );
    throw new Error( 'Start aborted.' );
  }

  bot.discord = discord;

  fs.readdirSync( './handlers' ).forEach( ( H ) => { require( './handlers/' + H )( discord ); } );

  discord.login( env.token ).then( loggedIn => {
    console.log( 'Successfully connected!' );
  } ).catch( errLogin => {
    console.error( 'There was an error logging in:\n%s', errLogin.stack );
  } );

//  require( corePath.webDash )();
} ).catch( errDB => {
  console.error( 'Failed to initialize database in %s: %o', strScript, errDB );
  throw new Error( 'Start aborted.' );
} );