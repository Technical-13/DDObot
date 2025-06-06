const client = require( '..' );
const { EmbedBuilder, Collection, PermissionsBitField } = require( 'discord.js' );
const ms = require( 'ms' );
const chalk = require( 'chalk' );
const cooldown = new Collection();
const userPerms = require( '../functions/getPerms.js' );
const botVerbosity = client.verbosity;
const objNamespaces = require( '../jsonObjects/nsDDOwiki.json' );
const objNamespaces = require( '../jsonObjects/wikiProjects.json' );
const strScript = chalk.hex( '#FFA500' ).bold( './events/messageCreate.js' );
Array.prototype.getDistinct = function() { return this.filter( ( val, i, arr ) => i == arr.indexOf( val ) ) };
const getDebugString = ( thing ) => {
  if ( Array.isArray( thing ) ) { return '{ object-Array: { length: ' + thing.length + ' } }'; }
  else if ( Object.prototype.toString.call( thing ) === '[object Date]' ) { return '{ object-Date: { ISOstring: ' + thing.toISOString() + ', value: ' + thing.valueOf() + ' } }'; }
  else if ( typeof( thing ) != 'object' ) { return thing; }
  else {
    let objType = ( thing ? 'object-' + thing.constructor.name : typeof( thing ) );
    let objId = ( thing ? thing.id : 'no.id' );
    let objName = ( thing ? ( thing.displayName || thing.globalName || thing.name ) : 'no.name' );
    return '{ ' + objType + ': { id: ' + objId + ', name: ' + objName + ' } }';
  }
};

client.on( 'messageCreate', async ( message ) => {
  try {
    const { author, channel, content, guild, mentions } = message;
    if ( channel.type !== 0 && channel.type !== 10 && channel.type !== 11 && channel.type !== 12 ) return;//Not a text type channel within a guild
    const { applicationId, authorId, webhookId } = message.toJSON();
    if ( !applicationId && webhookId === authorId ) return;//It's a webhook
    const allowedBots = [];
    const isAllowedBot = ( allowedBots.indexOf( author.id ) != -1 ? true : false );
    if ( author.bot && !isAllowedBot ) return;//It's a bot that is not allowed
    const { botOwner, checkPermission, clientId, errors, isBlacklisted, isBotMod, isBotOwner, isDevGuild, isGlobalWhitelisted, isGuildBlacklisted, prefix } = await userPerms( author, guild );
    if ( errors.hasNoMember ) {
      throw new Error( errors.noMember.console + '\n\tisBot: ' + ( author.bot ? 'true' : 'false' ) + '\n\tapplicationId: ' + applicationId + '\n\twebhookId: ' + webhookId );
    }
    const bot = client.user;
    const members = guild.members.cache;

    const sayEveryone = ( ( checkPermission( 'MentionEveryone' ) && mentions.everyone ) ? true : false );
    const strEveryoneHere = ( sayEveryone ? '`@' + ( /@everyone/g.test( content ) ? 'everyone' : 'here' ) + '`' : null );
    const foundLinks = [];
    const codeBlocks = new RegExp( /([`]{3}(?:\n?.*?\n?)[`]{3})/g );
    const codeInline = new RegExp( /([`]{1}.*?[`]{1})/g );
    const noCodeContent = content.replace( codeBlocks, '' ).replace( codeInline, '' );
    const regWikiLinks = new RegExp( /\[\[([^\|\]]*)(?:\|[^\]]*)?\]\][^\s\p{P}]*/gu );
    const arrWikiLinks = ( noCodeContent.match( regWikiLinks ) || [] );
    if ( arrWikiLinks.length >= 1 ) {
      for ( let rawLink of arrWikiLinks ) {
        const extraText = ( ( rawLink.lastIndexOf( ']' ) + 1 ) === rawLink.length ? null : rawLink.slice( rawLink.lastIndexOf( ']' ) + 1 ) );
        const cleanLink = ( extraText ? rawLink.slice( 0, rawLink.lastIndexOf( ']' ) ) : rawLink ).replace( /[\[\]]/g, '' ).split( '|' );
        foundLinks.push( '[' + ( cleanLink.length == 2 ? cleanLink[ 1 ] + ( !extraText ? '' : extraText ) : cleanLink[ 0 ] + ( !extraText ? '' : extraText ) ) + ']' );
      }
    }
    const regTemplateLinks = new RegExp( /\{\{([^\|\}]*)(?:\|[^\}]*)?\}\}/g );
    const arrTemplateLinks = ( noCodeContent.match( regTemplateLinks ) || [] );
    if ( arrTemplateLinks.length >= 1 ) {
      for ( let rawLink of arrTemplateLinks ) {
        const cleanLink = rawLink.replace( /[\{\}]/g, '' ).split( '|' );
        foundLinks.push( '[Template:' + cleanLink[ 0 ] + ']' );
      }
    }
    if ( foundLinks.length >= 1 ) {
      foundLinks.each( ( k, v ) => {
        const allParts = v.match( /\[([\w]*:)?([\w]*:)?(.*?)(#(?:.*?))?(\|(?:.*?))?\]/ );
        var lnkMarkdown = '[' + ( allParts[ 5 ]?.replace( '|', '' ) ?? ( allParts[ 1 ] ?? '' ) + ( allParts[ 2 ] ?? '' ) + allParts[ 3 ] + ( allParts[ 4 ] ?? '' ) ) + '](https://' + ( objWikiProjects[ allParts[ 1 ]?.replace( ':', '' ) ] ?? objWikiProjects.ddo ) + '/' + ( objNamespaces[ allParts[ 2 ]?.replace( ':', '' ) ] ?? '' ) + allParts[ 3 ] + ( allParts[ 4 ] ?? '' ) + ')';
        foundLinks[ k ] = lnkMarkdown;
      } );
      foundLinks.getDistinct();

      const mentionsMbrs = Array.from( mentions.members.keys() );
      const mentionsMbrsStr = ( mentionsMbrs.length === 0 ? '' : '<@' + mentionsMbrs.join( '>, <@' ) + '>' );
      const mentionsRoles = Array.from( mentions.roles.keys() );
      const mentionsRolesStr = ( mentionsRoles.length === 0 ? '' : '<@&' + mentionsRoles.join( '>, <@&' ) + '>' );
      const allMentions = ( mentionsMbrs.length + mentionsRoles.length === 0 ? null : mentionsMbrsStr + mentionsRolesStr );
      const doMentions = ( sayEveryone ? strEveryoneHere : ( !allMentions ? null : allMentions ) );
      channel.send( { content: ( doMentions ? doMentions + '\n' : '' ) + '➡️ ' + foundLinks.join( '\n➡️ ' ) } )
        .catch( async errSend => { await errHandler( errSend, { command: 'messageCreate', channel: channel, type: 'errSend' } ); } );
    }

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
              if ( !members.get( bot.id ).permissions.has( PermissionsBitField.resolve( command.botPerms || [] ) ) ) {
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

              if ( !members.get( bot.id ).permissions.has( PermissionsBitField.resolve( command.botPerms || [] ) ) ) {
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
  }
  catch ( errObject ) {
    const { author, channel, content, guild } = message;
    console.error( 'Uncaught error in %s:\n\t%s\n\tI was processing a message from %s in https://discord.com/channels/%s/%s\n%s\n-----',
    strScript, errObject.stack, getDebugString( author ), guild.id, channel.id, content );
  }
} );