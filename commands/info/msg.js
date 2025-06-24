const chalk = require( 'chalk' );
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require( 'discord.js' );
const modData = { group: 'info', name: 'msg', type: 'commands' };
const strScript = chalk.hex( '#FFA500' ).bold( './' + modData.type + '/' + modData.group + '/' + modData.name + '.js' );

module.exports = {
  name: 'msg',
  group: 'info',
  description: 'Get information about a message sent to dev console (for now)\n\t§msg [https://discord.com/channels/guildID/channelID/messageID]',
  modOnly: true,
  cooldown: 1000,
  run: async ( client, message, args ) => {
    try {
      if ( args.length === 1 ) {
        const path = ( args[ 0 ].match( /https?:\/\/(?:ptb\.)?discord\.com\/channels\/(?<srvID>\d{18,20})\/(?<chanID>\d{18,20})\/(?<msgID>\d{18,20})/i ).groups || null );
        if ( !path ) { throw new Error( 'Unable to find message with link: ' + args[ 0 ] ); }
        const guild = await client.guilds.fetch( path.srvID ).catch( errGuild => { return errGuild } );console.log( 'guild : %o', ( guild.id ? guild.toJSON() : guild ) );
        if ( !guild ) { throw new Error( 'I\'m not in a guild with an ID of: ' + path.srvID ); }
        const channel = await guild.channels.fetch( path.chanID ).catch( errChan => { return errChan } );console.log( 'channel : %o', ( channel.id ? channel.toJSON() : channel ) );
        if ( !channel ) { throw new Error( 'I couldn\'t find a channel in the guild with an ID of: ' + path.chanID ); }
        const message = await channel?.messages.fetch( path.msgID ).catch( errMsg => { return errMsg } );
        if ( !message ) { throw new Error( 'I couldn\'t find a message in the channel with an ID of: ' + path.msgID ); }
        console.log( 'message: %o', ( message.id ? message.toJSON() : message ) );
      }
      else { console.log( 'Command was malformed.  Please try again.' ); }

      message.delete();
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};