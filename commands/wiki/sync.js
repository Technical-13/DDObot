const chalk = require( 'chalk' );
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require( 'discord.js' );
const userPerms = require( '../../functions/getPerms.js' );
const strScript = chalk.hex( '#FFA500' ).bold( './commands/wiki/sync.js' );

module.exports = {
  name: 'sync',
  group: 'wiki',
  description: 'Force Discord ←→ DDOwiki sync for known confirmed user.\n' +
    '\t`§sync <@discord member id> (*wiki user snowflake|#wiki user id|@wiki user username) [\`reason\`]`\n\n' +
    '\t\t`<@discord member id>` is either just @ the member or if they are not in channel/guild, copy their user ID and paste `<@`**__`paste id here`__**`>`\n' +
    '\t\t`(*wiki user snowflake|#wiki user id|@wiki user username)` is whom on wiki you are linking to:\n' +
    '\t\t\t- `*wiki user snowflake` is the `snowflake` of the user from on wiki. Must be prefixed with **`*`**\n' +
    /*'\t\t\t  You can get this by going to their user page and clinking the link in the sidebar.' +//*/ //Not yet - working on it
    '\t\t\t- `#wiki user id` is the `id` of the user from on wiki. Must be prefixed with **`#`**' +
    '\t\t\t- `@wiki user username` is the CASE SENSITIVE `username` of the user from on wiki. Must be prefixed with **`@`**' +
    '\t\t`\`reason\`` is optional, but why do you need to do the linking for them?\n',
  cooldown: 1000,
  run: async ( client, message, args ) => {
    try {
      const { author, channel, guild } = message;
      const authorRoles = guild.members.cache.get( author ).roles
      const { botOwner, isBotOwner, isBotMod, hasRole } = await userPerms( author, guild );
      //var dmReply = author.send( { content: 'Processing your request.' } );
      //var delChanResp = message.reply( { content: 'Processing your request, please see our DM channel.' } );
      var dmReply = message.reply( { content: 'Please wait...' } );
      if ( hasRole( 'Administrator' ) ) {
        /* TBD */
      }
      else {
        dmReply.edit( { content: 'I\'m sorry, only <@&158570370817851394> have permission to get me to sync another wiki editor.\nIf you\'re trying to sync yourself, please use `/user link user:\`Wiki Username\``' } );
      }
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};