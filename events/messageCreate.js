const client = require( '..' );
const { EmbedBuilder, Collection, PermissionsBitField } = require( 'discord.js' );
const ms = require( 'ms' );
const chalk = require( 'chalk' );
const cooldown = new Collection();
const userPerms = require( '../functions/getPerms.js' );
const errHandler = require( '../functions/errorHandler.js' );
const botVerbosity = client.verbosity;
const objNamespaces = require( '../jsonObjects/nsDDOwiki.json' );
const smCustom = require( '../jsonObjects/wikiProjects.json' );
const wmfWikiEndpoint = 'https://api.wikimedia.org/w/api.php?origin=*';
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

const getSiteMatrix = async function () {
  var smParams = {
    req: {
			action: 'sitematrix',
			format: 'json',
			formatversion: 2,
			smlangprop: 'code|site',
			smlimit: 'max',
			smsiteprop: 'url|code',
			smtype: 'language|special'
		},
    smArray: [ smCustom ],
    rawcontinue: true
	};
  var smResults = function ( smParams ) {
    var fetchSiteMatrixURL = wmfWikiEndpoint;
    if ( !smParams.rawcontinue ) { return smParams.smArray; }
    Object.keys( smParams.req ).forEach( key => { fetchSiteMatrixURL += '&' + encodeURIComponent( key ) + '=' + encodeURIComponent( smParams.req[ key ] ); } );
    return fetch( fetchSiteMatrixURL ).then( resSiteMatrixData => { return resSiteMatrixData.json(); } ).then( data => {
			for ( let key in data.sitematrix ) {
        if ( key !== 'count' && key !== 'specials' && !isNaN( key ) ) {
					const lang = data.sitematrix[ key ].code;
					siteWMF = { lang: lang };
					data.sitematrix[ key ].site.map( proj => { if ( !proj.closed ) { siteWMF[ proj.code ] = proj.url; } } );
          smParams.smArray.push( siteWMF );
        }
      }
      data.sitematrix.specials?.map( proj => {
        if ( !proj.closed && !proj.private ) {
          if ( !smParams.smArray.find( objProj => objProj.lang == proj.lang ) ) {
						const siteWMF = { lang: proj.lang };
						siteWMF[ proj.code ] = proj.url;
						smParams.smArray.push( siteWMF );
					}
					else {
						smParams.smArray.find( objProj => objProj.lang == proj.lang )[ proj.code ] = proj.url;
					}
        }
      } );
      if ( !data.continue ) { smParams.rawcontinue = false; }
      else { smParams.req.smcontinue = data.continue.smcontinue; }

      return smResults( smParams );
    } ).catch( smErr => {
      console.log( 'Error attempting to getSiteMatrix() with smParams: %o\nReturned: %o ', smParams, smErr );
      return [ 'ERROR' ];
    } );
  };
  return await smResults( smParams );
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
    var foundLinks = [], betaLinks = [];
    const codeBlocks = new RegExp( /([`]{3}(?:\n?.*?\n?)[`]{3})/g );
    const codeInline = new RegExp( /([`]{1}.*?[`]{1})/g );
    const noCodeContent = content.replace( codeBlocks, '' ).replace( codeInline, '' );
    const regWikiLinks = new RegExp( /\[\[([^\|\]]*)(?:\|[^\]]*)?\]\][^\s\p{P}]*/gu );
    const regTemplateLinks = new RegExp( /\{\{([^\|\}]*)(?:\|[^\}]*)?\}\}/g );
    const arrWikiLinks = ( noCodeContent.match( regWikiLinks ) || [] );
    const arrTemplateLinks = ( noCodeContent.match( regTemplateLinks ) || [] );
    if ( arrWikiLinks.length + arrTemplateLinks.length > 0 ) { /* TRON */console.log( await getSiteMatrix() );/* TROFF */ }
    if ( arrWikiLinks.length >= 1 ) {
      for ( let rawLink of arrWikiLinks ) {
        const extraText = ( ( rawLink.lastIndexOf( ']' ) + 1 ) === rawLink.length ? null : rawLink.slice( rawLink.lastIndexOf( ']' ) + 1 ) );
        const cleanLink = ( extraText ? rawLink.slice( 0, rawLink.lastIndexOf( ']' ) ) : rawLink ).replace( /[\[\]]/g, '' ).split( '|' );
        foundLinks.push( '[' + ( cleanLink.length == 2 ? cleanLink[ 1 ] + ( !extraText ? '' : extraText ) : cleanLink[ 0 ] + ( !extraText ? '' : extraText ) ) + ']' );
      }
      /* NEW METHOD OF GETTING LINK INFORMATION */
      for ( let rawLink of arrWikiLinks ) {
        let thisLink = {  };
        rawLink = rawLink.replace( /[\[\]]/g, '' ).split( '|' );
        thisLink.alt = rawLink[ 1 ];
        rawLink = rawLink[ 0 ].split( '#' );
        thisLink.section = rawLink[ 1 ];
        rawLink = rawLink[ 0 ].split( ':' );
        switch ( rawLink.length ) {
          case 4 : {
            thisLink.lang = rawLink[ 0 ];
            thisLink.site = rawLink[ 1 ];
            thisLink.namespace = rawLink[ 2 ];
            thisLink.page = rawLink[ 3 ];
            break;
          }
          case 3 : {
            //thisLink.lang || thisLink.site = rawLink[ 0 ];
            thisLink.site = rawLink[ 0 ];
            //thisLink.site || thisLink.namespace = rawLink[ 1 ];
            thisLink.namespace = rawLink[ 1 ];
            thisLink.page = rawLink[ 2 ];
            break;
          }
          case 2 : {
            //thisLink.site || thisLink.namespace = rawLink[ 0 ];
            thisLink.namespace = rawLink[ 0 ];
            thisLink.page = rawLink[ 1 ];
            break;
          }
          case 1 : {
            thisLink.page = rawLink[ 0 ];
            break;
          }
        }
        betaLinks.push( thisLink );
      }
    }
    if ( arrTemplateLinks.length >= 1 ) {
      for ( let rawLink of arrTemplateLinks ) {
        const arrRawLink = rawLink.replace( /[\{\}]/g, '' ).split( '|' )[ 0 ].split( ':' );
        const cleanPage = arrRawLink.pop();
        const cleanSite = ( !arrRawLink[ 0 ] || arrRawLink[ 0 ]?.toLowerCase() === 't' || arrRawLink[ 0 ]?.toLowerCase() === 'template' ? '' : arrRawLink[ 0 ] + ':' );
        foundLinks.push( '[' + cleanSite + 'Template:' + cleanPage + ']' );
      }
      /* NEW METHOD OF GETTING LINK INFORMATION */
      for ( let rawLink of arrTemplateLinks ) {
        let thisLink = {  };
        rawLink = rawLink.replace( /[\[\]]/g, '' ).split( '|' );
        thisLink.alt = rawLink[ 1 ];
        rawLink = rawLink[ 0 ].split( '#' );
        thisLink.section = rawLink[ 1 ];
        rawLink = rawLink[ 0 ].split( ':' );
        switch ( rawLink.length ) {
          case 3 : {
            thisLink.lang = rawLink[ 0 ];
            thisLink.site = rawLink[ 1 ];
            thisLink.namespace = 'Template';
            thisLink.page = rawLink[ 2 ];
            break;
          }
          case 2 : {
            thisLink.site = rawLink[ 0 ];
            thisLink.namespace = 'Template';
            thisLink.page = rawLink[ 1 ];
            break;
          }
          case 1 : {
            thisLink.namespace = 'Template';
            thisLink.page = rawLink[ 0 ];
            break;
          }
        }
        betaLinks.push( thisLink );
      }
    }
/* TRON */console.log( 'betaLinks: %o', betaLinks );/* TROFF */
    if ( foundLinks.length >= 1 ) {
      foundLinks = foundLinks.map( v => {
        const allParts = v.match( /\[(?:(.*?)(?:\:))?(?:(.*?)(?:\:))?(.*?)(#(?:.*?))?(?:(?:\|)(.*?))?\]/ );
        const lnkText = '[' + ( allParts[ 5 ] ?? ( allParts[ 1 ] || allParts[ 1 ] === '' ? allParts[ 1 ] + ':' : '' ) + ( allParts[ 2 ] || allParts[ 2 ] === '' ? allParts[ 2 ] + ':' : ( !allParts[ 1 ] && !allParts[ 3 ] ? 'Special:' : '' ) ) + ( allParts[ 3 ] ?? 'MyLanguage' ) + ( allParts[ 4 ] ?? '' ) ) + ']';
        const oneIsSite = ( objNamespaces[ allParts[ 1 ]?.toUpperCase() ] ? false : ( smCustom[ allParts[ 1 ]?.toLowerCase() ] ? true : false ) );
        const lnkSite = ( !allParts[ 2 ] && allParts[ 2 ] !== '' ? ( oneIsSite ? smCustom[ allParts[ 1 ]?.toLowerCase() ] : smCustom.ddo ) : ( smCustom[ allParts[ 1 ]?.toLowerCase() ] ?? smCustom.ddo ) );
        const lnkNSone = ( oneIsSite ? '' : ( allParts[ 1 ] == '' ? '' : ( allParts[ 1 ] ? ( objNamespaces[ allParts[ 1 ].toUpperCase() ] ?? allParts[ 1 ] ) + ':' : null ) ) );
        const lnkNStwo = ( allParts[ 2 ] == '' ? '' : ( allParts[ 2 ] ? ( objNamespaces[ allParts[ 2 ].toUpperCase() ] ?? allParts[ 2 ] ) + ':' : null ) );
        const lnkNamespace = ( lnkNSone === null && lnkNStwo === null ? '' : ( lnkNSone !== null && lnkNStwo === '' ? '' : ( lnkNSone !== null && lnkNStwo === null ? lnkNSone : lnkNStwo ) ) );
        const lnkPage = ( allParts[ 3 ] ?? 'MyLanguage' );
        const lnkSection = ( allParts[ 4 ] ?? '' );
        return lnkText + '(<https://' + lnkSite + '/' + lnkNamespace + lnkPage + lnkSection + '>)';
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