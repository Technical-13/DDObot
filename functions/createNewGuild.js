const chalk = require( 'chalk' );
const getBotConfig = require( '../functions/getBotDB.js' );
const guildConfig = require( '../models/GuildConfig.js' );
const config = require( '../config.json' );
const verGuildDB = config.verGuildDB;

module.exports = async ( guild ) => {
  try {
    const botConfig = await getBotConfig();
    const globalPrefix = ( botConfig.Prefix || config.prefix || '!' );
    const guildOwner = guild.members.cache.get( guild.ownerId );
    const newGuildConfig = {
      _id: guild.id,
      Bans: [],
      Blacklist: {
        Members: [],
        Roles: []
      },
      Commands: [],
      Expires: null,
      Guild: {
        Name: guild.name,
        Members: guild.members.cache.size,
        OwnerID: guild.ownerId,
        OwnerName: guildOwner.displayName
      },
      Invite: null,
      Logs: {
        Active: true,
        Chat: null,
        Default: null,
        Error: null
      },
      Part: {
        Active: false,
        Channel: null,
        Message: null,
        SaveRoles: true
      },
      Prefix: globalPrefix,
      Premium: true,
      Version: verGuildDB,
      Welcome: {
        Active: false,
        Channel: null,
        Message: null,
        Role: null
      },
      Whitelist: {
        Members: [],
        Roles: []
      }
    };
    return await guildConfig.create( newGuildConfig )
    .then( initSuccess => { console.log( chalk.bold.greenBright( 'Succesfully added guild %s (id: %s) to my database.' ), guild.name, guild.id ); return newGuildConfig; } )
    .catch( initError => { throw new Error( chalk.bold.red.bgYellowBright( `Error attempting to add guild ${guild.name} (id: ${guild.id}) to my database:\n${initError}` ) ); } );
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s: %s', chalk.hex( '#FFA500' ).bold( 'createNewGuild.js' ), errObject.stack ); }
};