const client = require( '..' );
const { EmbedBuilder, Collection, PermissionsBitField } = require( 'discord.js' );
const ms = require( 'ms' );
const cooldown = new Collection();
const userPerms = require( '../functions/getPerms.js' );

client.on( 'messageCreate', async message => {
  const { author, channel, content, guild, mentions } = message;
  if ( author.bot ) return;
  if ( channel.type !== 0 ) return;
  const { clientId, botOwner, isDevGuild, prefix, isBotOwner, isBotMod, isGlobalWhitelisted, isBlacklisted, isGuildBlacklisted } = await userPerms( author, guild );
  const bot = client.user;
  const objGuildMembers = guild.members.cache;

  const hasPrefix = ( content.startsWith( prefix ) || content.startsWith( '§' ) );
  const meMentionPrefix = '<@' + clientId + '>';
  const mePrefix = content.startsWith( meMentionPrefix );
  const mentionsMe = mentions.users.has( clientId );
  var args = [];
  if ( hasPrefix ) { args = content.slice( prefix.length ).trim().split( / +/g ); }
  else if ( mePrefix ) {
    args = content.slice( meMentionPrefix.length ).trim().split( / +/g );
    if ( args[ 0 ].startsWith( prefix ) ) {
      args[ 0 ] = args[ 0 ].slice( prefix.length ).trim();
      if ( args[ 0 ].length == 0 ) { args = args.shift(); }
    }
  }
  const cmd = ( args.shift() || [] );
  if ( cmd.length != 0 ) {
    let command = client.commands.get( cmd.toLowerCase() );
    if ( !command ) command = client.commands.get( client.aliases.get( cmd ) );

    if ( isBlacklisted && !isGlobalWhitelisted ) {
      return message.reply( { content: 'You\'ve been blacklisted from using my commands' + ( isGuildBlacklisted ? ' in this server.' : '.' ) } );
    }
    else if ( command ) {
      const isOwnerOnly = command.ownerOnly;
      const isModOnly = command.modOnly;
      if ( isOwnerOnly && !isBotOwner ) {
        if ( isBotMod ) { return message.reply( { content: `That is an **owner only command**, speak to <@${botOwner.id}>.` } ); }
        else { /* DO NOTHING */ }
      }
      else if ( isModOnly && !isBotMod ) { /* DO NOTHING */ }
      else {
        if ( command.cooldown ) {
          if ( cooldown.has( `${command.name}${author.id}` ) ) {
            return channel.send( { content: `You are on \`${ms(cooldown.get(`${command.name}${author.id}`) - Date.now(), {long : true})}\` cooldown!` } );
          }
          if ( command.userPerms || command.botPerms ) {
            if ( !message.member.permissions.has( PermissionsBitField.resolve( command.userPerms || [] ) ) ) {
              const userPerms = new EmbedBuilder()
              .setDescription( `🚫 ${author}, You don't have \`${command.userPerms}\` permissions to use this command!` )
              .setColor( 'Red' )
              return message.reply( { embeds: [ userPerms ] } );
            }
            if ( !objGuildMembers.get( bot.id ).permissions.has( PermissionsBitField.resolve( command.botPerms || [] ) ) ) {
              const botPerms = new EmbedBuilder()
              .setDescription( `🚫 ${author}, I don't have \`${command.botPerms}\` permissions to use this command!` )
              .setColor( 'Red' )
              return message.reply( { embeds: [ botPerms ] } );
            }
          }

          command.run( client, message, args );
          cooldown.set( `${command.name}${author.id}`, Date.now() + command.cooldown );
          setTimeout( () => { cooldown.delete( `${command.name}${author.id}` ) }, command.cooldown );
        }
        else {
          if ( command.userPerms || command.botPerms ) {
            if ( !message.member.permissions.has( PermissionsBitField.resolve( command.userPerms || [] ) ) ) {
              const userPerms = new EmbedBuilder()
              .setDescription( `🚫 ${message.author}, You don't have \`${command.userPerms}\` permissions to use this command!` )
              .setColor( 'Red' )
              return message.reply( { embeds: [userPerms] } );
            }

            if ( !objGuildMembers.get( bot.id ).permissions.has( PermissionsBitField.resolve( command.botPerms || [] ) ) ) {
              const botPerms = new EmbedBuilder()
              .setDescription( `🚫 ${author}, I don't have \`${command.botPerms}\` permissions to use this command!` )
              .setColor( 'Red' )
              return message.reply( { embeds: [ botPerms ] } );
            }
          }
          command.run( client, message, args );
        }
      }
    }
  }
} );