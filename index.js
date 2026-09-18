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
require( 'dotenv' ).config();
const { EventEmitter } = require( 'events' );
const utils = require( './functions/utils.js' );
const { buildPath } = utils;
const modData = buildPath( { name: 'index' } );
const corePath = {
  bbeg: buildPath( { name: 'errorHandler', type: 'functions' } ).path,
  config: buildPath( { ext: 'json', name: 'config' } ).path,
  db: buildPath( { name: 'initialize', platform: 'mongodb' } ).path,
  discord: buildPath( { name: 'clientDiscord', type: 'functions' } ).path,
  Err: buildPath( { name: 'Err', type: 'functions' } ).path,
  timeFormat: buildPath( { ext: 'json', name: 'time', type: 'jsonObjects' } ).path,
  webDash: buildPath( { name: 'server', platform: 'webDashboard' } ).path
};
const dClient = require( corePath.discord );
const bot = {
  ascii: require( 'ascii-table' ),
  bbeg: require( corePath.bbeg ),
  buildPath: buildPath,
  chalk: require( 'chalk' ),
  config: require( corePath.config ),
  djs: require( 'discord.js' ),
  env: process.env,
  Err: require( corePath.Err ),
  events: new EventEmitter(),
  fs: require( 'fs' ),
  mongoose: require( 'mongoose' ),
  timeFormat: require( corePath.timeFormat ),
  utils: utils
};
bot.events.setMaxListeners( 100 );
module.exports = bot;
const { chalk, config, env, fs } = bot;
const iDiscoBots = [];
const { personas } = config.discord;
personas.forEach( ego => { if ( ego.enabled ) { iDiscoBots.push( ego.idn ); } } );

require( corePath.db )().then( async () => {
  console.log( 'Database initialization sequence completed successfully.' );

  const discord = {};
  for ( const sEgo of iDiscoBots ) {
    const persona = personas.find( p => p.idn === sEgo );
    discord[ sEgo ] = await dClient( persona );
    if ( !discord[ sEgo ] ) {
      console.error( 'Failed to initialize Discord client: %s', persona.botName );
    }
  }
  bot.discord = discord;

//  require( corePath.webDash )();
} ).catch( errDB => {
  console.error( 'Failed to initialize database in %s: %o', chalk.hex( '#FFA500' ).bold( buildPath( modData ).path ), errDB );
  throw new Error( 'Start aborted.' );
} );