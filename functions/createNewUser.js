const chalk = require( 'chalk' );
const config = require( '../config.json' );
const userConfig = require( '../models/BotUser.js' );
const verUserDB = config.verUserDB;

module.exports = async ( user ) => {
  if ( !user ) { throw new Error( chalk.bold.red( `No user in createNewUser.js: ${user}` ) ); }
  try {
    if ( await userConfig.countDocuments( { _id: user.id } ) != 0 ) { console.error( 'User "%s" already exists in my database.', user.displayName ); }
    else {
      const newBotUser = {
        _id: user.id,
        Guilds: [],
        Guildless: null,
        UserName: user.displayName,
        Score: 0,
        Version: verUserDB
      }
      return await userConfig.create( newBotUser )
      .catch( initError => { throw new Error( chalk.bold.black.bgCyan( `Error attempting to add ${user.displayName} (id: ${user.id}) to my user database in createNewUser.js:\n${initError}` ) ); } );
    }
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s: %s', chalk.hex( '#FFA500' ).bold( 'createNewUser.js' ), errObject.stack ); }
};