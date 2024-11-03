const client = require( '..' );
const chalk = require( 'chalk' );
const userConfig = require( '../models/BotUser.js' );
const createNewUser = require( './createNewUser.js' );

module.exports = async ( id, guild ) => {
  try {
    const user = client.users.cache.get( id );
    const member = guild.members.cache.get( id );
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
    .catch( updateError => { throw new Error( chalk.bold.red.bgYellowBright( `Error attempting to add guild ${guild.name} (id: ${guild.id}) to user ${user.displayName} (id: ${id}) in my database in addUserGuild.js:\n${updateError}` ) ); } );
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s: %s', chalk.hex( '#FFA500' ).bold( 'addUserGuild.js' ), errObject.stack ); }
};