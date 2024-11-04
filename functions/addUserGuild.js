const client = require( '..' );
const chalk = require( 'chalk' );
const userConfig = require( '../models/BotUser.js' );
const createNewUser = require( './createNewUser.js' );

module.exports = async ( id, guild ) => {
  if ( !id ) { throw new Error( chalk.bold.red( `No id in addUserGuild.js: ${id}` ) ); }
  if ( !( /[\d]{17,19}/.test( id ) ) ) { throw new Error( chalk.bold.red( `id in addUserGuild.js is not a snowflake: ${id}` ) ); }
  if ( !guild ) { throw new Error( chalk.bold.red( `No guild for userId(${id}) in addUserGuild.js: ${guild}` ) ); }
  try {
    const user = client.users.cache.get( id );
    if ( !user ) { throw new Error( chalk.bold.red( `id in addUserGuild.js (${id}) is not a known user.id: ${user}` ) ); }
    const member = guild.members.cache.get( id );
    if ( !member ) { throw new Error( chalk.bold.red( `Member (${id} was not found in guild at addUserGuild.js): ${Array.from( guild.members.cache.keys() )}` ) ); }
    if ( await userConfig.countDocuments( { _id: id } ) === 0 ) { await createNewUser( user ); }
    const currUser = await userConfig.findOne( { _id: id } );
    const addGuild = {
      _id: guild.id,
      Bans: [],
      Expires: null,
      GuildName: guild.name,
      MemberName: member.displayName,
      Roles: Array.from( member.roles.cache.keys() ),
      Score: 0
    };
    currUser.Guilds.push( addGuild );
    currUser.Guildless = null;
    userConfig.updateOne( { _id: id }, currUser, { upsert: true } )
    .catch( updateError => { throw new Error( chalk.bold.black.bgCyan( `Error attempting to add guild ${guild.name} (id: ${guild.id}) to user ${user.displayName} (id: ${id}) in my database in addUserGuild.js:\n${updateError}` ) ); } );
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s: %s', chalk.hex( '#FFA500' ).bold( 'addUserGuild.js' ), errObject.stack ); }
};