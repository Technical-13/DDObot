const client = require( '..' );
const { EmbedBuilder, Collection, PermissionsBitField } = require( 'discord.js' );
const ms = require( 'ms' );
const { URL } = require( 'url' );
const chalk = require( 'chalk' );
const cooldown = new Collection();
const userPerms = require( '../functions/getPerms.js' );
const errHandler = require( '../functions/errorHandler.js' );
const botVerbosity = client.verbosity;
const objNamespaces = require( '../jsonObjects/nsDDOwiki.json' );
const wikiProjects = require( '../jsonObjects/wikiProjects.json' );
const smCustom = require( '../jsonObjects/smCustom.json' );
const wmfWikiEndpoint = 'https://api.wikimedia.org/w/api.php?origin=*';
const defaultLang = 'en';//I should make this pulled from the bot's client, database, config, or .env
const defaultSite = 'ddo';//I should make this pulled from the bot's client, database, config, or .env
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
    smArray: [ { langs: [] } ],
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
          if ( smParams.smArray[ 0 ].langs.indexOf( lang ) === -1 ) { smParams.smArray[ 0 ].langs.push( lang ); }
					siteWMF = { lang: lang };
					data.sitematrix[ key ].site.map( proj => {
            if ( !proj.closed ) { siteWMF[ proj.code ] = proj.url; }
          } );
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
            if ( smParams.smArray[ 0 ].langs.indexOf( proj.lang ) === -1 ) { smParams.smArray[ 0 ].langs.push( proj.lang ); }
            smParams.smArray.find( objProj => objProj.lang == proj.lang )[ proj.code ] = proj.url;
          }
        }
      } );
      smCustom.custom.map( proj => {
        if ( !smParams.smArray.find( objProj => objProj.lang == proj.lang ) ) {
          const siteCustom = { lang: proj.lang };
          siteCustom[ proj.code ] = proj.url;
          smParams.smArray.push( siteCustom );
        }
        else {
          if ( smParams.smArray[ 0 ].langs.indexOf( proj.lang ) === -1 ) { smParams.smArray[ 0 ].langs.push( proj.lang ); }
          smParams.smArray.find( objProj => objProj.lang == proj.lang )[ proj.code ] = proj.url;
        }
      } );
      if ( !data.continue ) { smParams.rawcontinue = false; }
      else { smParams.req.smcontinue = data.continue.smcontinue; }

      return smResults( smParams );
    } )
    .catch( smErr => {
      if ( !smParams.smArray[ 0 ].errors ) { smParams.smArray[ 0 ].errors = []; }
      const thisErr = {};
      thisErr[ smErr.code ] = smParams.smArray[ 0 ].errors.filter( errCode => smErr.code in errCode ).length + 1;
      thisErr.received = smErr;
      if ( smErr.code === 'UND_ERR_CONNECT_TIMEOUT' && ( smParams.timeout ?? 0 ) <= 5 ) {
        smParams.timeout = ( smParams.timeout ?? 0 ) + 1;
        let retryIn = 5000;
        retryIn = retryIn * ( smParams.timeout < 3 ? smParams.timeout : 3 );
        retryIn = retryIn * ( smParams.timeout <= 3 ? 1 : 2 ** ( 5 - smParams.timeout ) );
        thisErr.retryIn = retryIn;
        console.warn( 'Timed out attempting to getSiteMatrix().  Retrying in %s seconds.', retryIn / 1000 );
        setTimeout( () => { return smResults( smParams ); }, retryIn );
      }
      else {
        console.error( 'Error attempting to getSiteMatrix() with smParams: %o\nReturned: %o ', smParams, smErr );
        smCustom.custom.map( proj => {
          if ( !smParams.smArray.find( objProj => objProj.lang == proj.lang ) ) {
            const siteCustom = { lang: proj.lang };
            siteCustom[ proj.code ] = proj.url;
            smParams.smArray.push( siteCustom );
          }
          else {
            if ( smParams.smArray[ 0 ].langs.indexOf( proj.lang ) === -1 ) { smParams.smArray[ 0 ].langs.push( proj.lang ); }
            smParams.smArray.find( objProj => objProj.lang == proj.lang )[ proj.code ] = proj.url;
          }
        } );
        return smParams.smArray;
      }
      smParams.smArray[ 0 ].errors.push( thisErr );
    } );
  };
  return await smResults( smParams );
};
const getWikiNamespaces = async function ( wikiURL ) {
  var siParams = {
    action: 'query',
    format: 'json',
    formatversion: 2,
    meta: 'siteinfo',
    siprop: 'namespaces|namespacealiases'
  };
  var fetchNamespacesURL = 'https://' + ( new URL( wikiURL ) ).hostname + '';
}
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
    if ( arrWikiLinks.length + arrTemplateLinks.length > 0 ) { const siteMatrix = await getSiteMatrix(); }
    if ( arrWikiLinks.length >= 1 ) {
      for ( let rawLink of arrWikiLinks ) {
        const extraText = ( ( rawLink.lastIndexOf( ']' ) + 1 ) === rawLink.length ? null : rawLink.slice( rawLink.lastIndexOf( ']' ) + 1 ) );
        const cleanLink = ( extraText ? rawLink.slice( 0, rawLink.lastIndexOf( ']' ) ) : rawLink ).replace( /[\[\]]/g, '' ).split( '|' );
        foundLinks.push( '[' + ( cleanLink.length == 2 ? cleanLink[ 1 ] + ( !extraText ? '' : extraText ) : cleanLink[ 0 ] + ( !extraText ? '' : extraText ) ) + ']' );
      }
      /* NEW METHOD OF GETTING LINK INFORMATION */
      for ( let rawLink of arrWikiLinks ) {
        rawLink = rawLink.replace( /[\[\]]/g, '' ).split( '|' );
        const altText = rawLink[ 1 ];
        rawLink = rawLink[ 0 ].split( '#' );
        const section = rawLink[ 1 ];
        rawLink = rawLink[ 0 ].split( ':' );
        switch ( rawLink.length ) {
          case 4 : {
            isLangX = ( rawLink[ 0 ] === '' );
            isLang0 = ( siteMatrix[ 0 ].langs.indexOf( rawLink[ 0 ] ) !== -1 );
            isLang1 = ( siteMatrix[ 0 ].langs.indexOf( rawLink[ 1 ] ) !== -1 );
            isSiteX = ( rawLink[ 1 ] === '' );
            isSite0 = ( siteMatrix[ 0 ].sites.indexOf( rawLink[ 0 ] ) !== -1 );
            isSite1 = ( siteMatrix[ 0 ].sites.indexOf( rawLink[ 1 ] ) !== -1 );
            isNmSpX = ( rawLink[ 2 ] === '' );
            isPageX = ( rawLink[ 3 ] === '' );
            lang = ( isLangX || ( !isLang0 && !isLang1 ) ? defaultLang : ( isLang0 ? rawLink[ 0 ] : rawLink[ 1 ] ) );
            site = ( siteMatrix.find( aLang => aLang[ lang ] == rawLink[ 1 ] ) ? defaultSite : rawLink[ 1 ] );
            namespace = rawLink[ 2 ];
            page = rawLink[ 3 ];
            url = '';
            break;
          }
          case 3 : {
            if ( wikiLangs.indexOf( rawLink[ 0 ] ) !== -1 ) {
              lang = rawLink[ 0 ];
              if ( siteMatrix.site ) {
                site = rawLink[ 1 ];
              }
            }
            //site || namespace = rawLink[ 1 ];
            namespace = rawLink[ 1 ];
            page = rawLink[ 2 ];
            break;
          }
          case 2 : {
            //site || namespace = rawLink[ 0 ];
            namespace = rawLink[ 0 ];
            page = rawLink[ 1 ];
            break;
          }
          case 1 : {
            page = rawLink[ 0 ];
            break;
          }
        }
        betaLinks.push( 'XXXXX' );
      }//*/
    }
    if ( arrTemplateLinks.length >= 1 ) {
      for ( let rawLink of arrTemplateLinks ) {
        const arrRawLink = rawLink.replace( /[\{\}]/g, '' ).split( '|' )[ 0 ].split( ':' );
        const cleanPage = arrRawLink.pop();
        const cleanSite = ( !arrRawLink[ 0 ] || arrRawLink[ 0 ]?.toLowerCase() === 't' || arrRawLink[ 0 ]?.toLowerCase() === 'template' ? '' : arrRawLink[ 0 ] + ':' );
        foundLinks.push( '[' + cleanSite + 'Template:' + cleanPage + ']' );
      }
      /* NEW METHOD OF GETTING LINK INFORMATION */
      /*for ( let rawLink of arrTemplateLinks ) {
        let thisLink = {  };
        rawLink = rawLink.replace( /[\{\}]/g, '' ).split( '|' );
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
      }//*/
    }
/* TRON */console.log( 'betaLinks: %o', betaLinks );/* TROFF */
    /*if ( betaLinks.length >= 1 ) {
      betaLinks = betaLinks.map( link => {
        let lnkText = ( link.alt ?? ( !link.lang ? '' : link.lang + ':' ) + ( !link.site ? '' : link.site + ':' ) + ( !link.namespace ? '' : link.namespace + ':' ) + link.page + ( !link.section ? '' : '#' + link.section ) );
        return '[' + lnkText + '](<' + link.url + '/' + lnkSite + lnkNamespace + lnkPage + lnkSection + '>)';
      } );
    }//*/
    if ( foundLinks.length >= 1 ) {
      foundLinks = foundLinks.map( v => {
        const allParts = v.match( /\[(?:(.*?)(?:\:))?(?:(.*?)(?:\:))?(.*?)(#(?:.*?))?(?:(?:\|)(.*?))?\]/ );
        const lnkText = '[' + ( allParts[ 5 ] ?? ( allParts[ 1 ] || allParts[ 1 ] === '' ? allParts[ 1 ] + ':' : '' ) + ( allParts[ 2 ] || allParts[ 2 ] === '' ? allParts[ 2 ] + ':' : ( !allParts[ 1 ] && !allParts[ 3 ] ? 'Special:' : '' ) ) + ( allParts[ 3 ] ?? 'MyLanguage' ) + ( allParts[ 4 ] ?? '' ) ) + ']';
        const oneIsSite = ( objNamespaces[ allParts[ 1 ]?.toUpperCase() ] ? false : ( wikiProjects[ allParts[ 1 ]?.toLowerCase() ] ? true : false ) );
        const lnkSite = ( !allParts[ 2 ] && allParts[ 2 ] !== '' ? ( oneIsSite ? wikiProjects[ allParts[ 1 ]?.toLowerCase() ] : wikiProjects.ddo ) : ( wikiProjects[ allParts[ 1 ]?.toLowerCase() ] ?? wikiProjects.ddo ) );
        const lnkNSone = ( oneIsSite ? '' : ( allParts[ 1 ] == '' ? '' : ( allParts[ 1 ] ? ( objNamespaces[ allParts[ 1 ].toUpperCase() ] ?? allParts[ 1 ] ) + ':' : null ) ) );
        const lnkNStwo = ( allParts[ 2 ] == '' ? '' : ( allParts[ 2 ] ? ( objNamespaces[ allParts[ 2 ].toUpperCase() ] ?? allParts[ 2 ] ) + ':' : null ) );
        const lnkNamespace = ( lnkNSone === null && lnkNStwo === null ? '' : ( lnkNSone !== null && lnkNStwo === '' ? '' : ( lnkNSone !== null && lnkNStwo === null ? lnkNSone : lnkNStwo ) ) );
        const lnkPage = ( allParts[ 3 ] ?? 'MyLanguage' );
        const lnkSection = ( allParts[ 4 ] ?? '' );
        return lnkText + '(<https://' + encodeURI( lnkSite + '/' + lnkNamespace + lnkPage + lnkSection ) + '>)';
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