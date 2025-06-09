const config = require( '../../config.json' );
const wikiGuildId = config.devGuildId;
const wikiLinkChanId = '480750505514106891';
//const wikiGuildId = '153007361655570432';//DDOwiki
//const wikiLinkChanId = '1379979815095894180';//DDOwiki#link-requests
const ddoWikiApiEndpoint = 'https://ddowiki.com/api.php?origin=*';
const chalk = require( 'chalk' );
const { ApplicationCommandType, InteractionContextType } = require( 'discord.js' );
const getGuildConfig = require( '../../functions/getGuildDB.js' );
const userPerms = require( '../../functions/getPerms.js' );
const strScript = chalk.hex( '#FFA500' ).bold( './slashCommands/wiki/user.js' );

const getWikiNames = async function ( wikiUsername ) {
  var fetchUsersURL = ddoWikiApiEndpoint;
  var auParams = {
    req: {
      action: 'query',
      aufrom: wikiUsername.toUpperCase(),
      aulimit: 'max',
      auto: wikiUsername.toLowerCase(),
      format: 'json',
      formatversion: '2',
      list: 'allusers'
    },
    auArray: [],
    rawcontinue: true
  };
  var auResults = function ( auParams ) {
    if ( !auParams.rawcontinue ) { return auParams.auArray; }
    Object.keys( auParams.req ).forEach( key => { fetchUsersURL += '&' + encodeURIComponent( key ) + '=' + encodeURIComponent( auParams.req[ key ] ); } );
    return fetch( fetchUsersURL ).then( resUsersData => { return resUsersData.json(); } ).then( data => {
      auParams.auArray = auParams.auArray.concat( data.query.allusers.filter( function ( u ) { if ( u.name.toLowerCase() === wikiUsername.toLowerCase() ) { return u } } ).map( function ( u ) { return u.name; } ) );
      if ( !data.continue ) { auParams.rawcontinue = false; }
      else { auParams.req.aufrom = data.continue.aufrom; }

      return auResults( auParams );
    } ).catch( auErr => {
      console.log( 'Error attempting to getWikiNames( \'%s\' ) with auParams: %o\nReturned: %o ', wikiUsername, auParams, auError );
      return [ 'ERROR' ];
    } );
  };
  return await auResults( auParams );
}

module.exports = {
  name: 'user',
  description: 'Manage your Discord ←→ DDOwiki settings',
  type: ApplicationCommandType.ChatInput,
  contexts: [ InteractionContextType.Guild ],
  group: 'wiki',
  devOnly: true,
  options: [
    { type: 1, name: 'link', description: 'Get a link to sync Discord & DDOwiki', options: [
      { type: 3, name: 'wiki-username', description: 'What is your username on DDOwiki?', required: true }
    ] },
    { type: 1, name: 'validate', description: 'Validate Discord ←→ DDOwiki connection', options: [
      { type: 3, name: 'link-code', description: 'The `«Link Code»` you got from `/user link`.', required: true }
    ] },
    { type: 1, name: 'set', description: 'Modify your settings', options: [
      { type: 3, name: 'notifications', description: 'Toggle notification settings', choices: [
        { name: 'Mentions', value: 'mentions' }, { name: 'Talk', value: 'talk' }
      ] }
    ] },
    { type: 1, name: 'update', description: 'Update your Discord information on your DDOwiki page automatically.' }
  ],
  cooldown: 1000,
  run: async ( client, interaction ) => {
    await interaction.deferReply( { ephemeral: true } );
    const { channel, guild, options, user: member } = interaction;
    const { isGlobalBlacklisted, content } = await userPerms( member, guild );

    try {
      if ( guild.id != wikiGuildId ) {
        const guildConfig = await getGuildConfig( guild );
        const doGuild = client.guilds.cache.get( wikiGuildId );
        const objGuild = doGuild.toJSON();
        const roleEveryone = guild.roles.cache.find( role => role.name === '@everyone' );
        const vanityURLCode = objGuild.vanityURLCode;
if ( vanityURLCode ) { console.log( '%s has a vanityURLCode: %s', guildName, vanityURLCode ); }//don't know what this looks like in the API...
        const chanWidget = ( objGuild.widgetEnabled ? objGuild.widgetChannelId : null );
        const chanRules = objGuild.rulesChannelId;
        const chanPublicUpdates = objGuild.publicUpdatesChannelId;
        const chanSafetyAlerts = objGuild.safetyAlertsChannelId;
        const chanSystem = objGuild.systemChannelId;
        const chanFirst = Array.from( doGuild.channels.cache.filter( chan => !chan.nsfw && chan.permissionsFor( roleEveryone ).has( 'ViewChannel' ) ).keys() )[ 0 ];
        const definedInvite = ( guildConfig ? guildConfig.Invite : null );
        const chanInvite = ( definedInvite || chanWidget || chanRules || chanPublicUpdates || chanSafetyAlerts || chanSystem || chanFirst );
        if ( !doGuild.members.cache.get( member.id ) ) {
          wikiGuildLink = await doGuild.invites.create( chanInvite, { maxAge: 900, reason: 'Invite created by ' + member.displayName + ' with `/user`.' } )
            .then( invite => { return 'https://discord.gg/invite/' + invite.code; } )
            .catch( errInvite => { return interaction.editReply( 'Failed to get invite for the `' + client.guilds.cache.get( wikiGuildId ).name + '` server.' ); } );
        } else { wikiGuildLink = 'https://discordapp.com/channels/' + wikiGuildId + '/' + chanInvite; }
        return interaction.editReply( 'Sorry! You can only do this from the [`' + client.guilds.cache.get( wikiGuildId ).name + '`](<' + wikiGuildLink + '>) server.' );
      }

      switch ( options.getSubcommand() ) {
      case 'link': {
        const wikiUserName = options.getString( 'wiki-username', true );
        const arrWikiNames = await getWikiNames( wikiUserName );
        if ( arrWikiNames[ 0 ] === 'ERROR' ) { return interaction.editReply( 'An error trying to get possible wiki usernames for `' + wikiUserName + '` was encountered.' ); }
        if ( arrWikiNames.indexOf( wikiUserName ) === -1 && arrWikiNames.length !== 1 ) {
          return interaction.editReply( 'Wiki usernames are case sensative and `' + wikiUserName + '` was not found.' +
            ( arrWikiNames.length < 1 ? '  Please try again with the proper username.' : '\nPerhaps you meant:\n:arrow_right: ' + arrWikiNames.join( '\n:arrow_right: ' ) ) );
        }
        const userJSON = client.users.cache.get( member.id ).toJSON();
        const linkData = {
          id: userJSON.id,
          username: userJSON.username,
          globalName: userJSON.globalName,
          createdTimestamp: userJSON.createdTimestamp
        };
        const wikiParams = 'dataDiscord=' + JSON.stringify( { DDObot: linkData } );
        const linkUserName = ( arrWikiNames.indexOf( wikiUserName ) !== -1 ? wikiUserName : arrWikiNames[ 0 ] );
        guild.channels.cache.get( wikiLinkChanId ).send( { content: '<@' + member + '> is attempting to `/user link` with `User:' + linkUserName + '`.\n' +
          ':link: <https://ddowiki.com/index.php?title=User:' + encodeURIComponent( linkUserName ) + '/Discord.json&action=edit&' + wikiParams + '>' +
          '```json\n{\n\tuser: {\n\t\t' +
            Object.entries( linkData ).map( v => {return v[ 0 ] + ': ' + ( typeof( v[ 1 ] ) === 'string' ? '"' : '' ) + v[ 1 ] + ( typeof( v[ 1 ] ) === 'string' ? '"' : '' ); } ).join( '\n\t\t' ) +
          '\n\t}\n}\n```'
        } );
        return interaction.editReply( ':one: Make sure you are [logged in](<https://ddowiki.com/page/Special:UserLogin>) to DDOwiki.\n' +
          ':two: [Click here](<https://ddowiki.com/index.php?title=User:' + encodeURIComponent( linkUserName ) + '/Discord.json&action=edit&' + wikiParams + '>) to save your Discord information and get your `«Link Code»`\n' +
          ':three: Come back to discord and use the `/user validate code:«Link Code»` to link accounts.'
        );
      break; }
      case 'validate': {
        const wikiRoles = {//These should be stored elsewhere and managed automatically instead of hardcoded here.
          //'steward': '158570619934474242',//          Steward
          //'bureaucrat': '248431728002072579',//       Bureaucrat
          //'checkuser': '1372008501898903624',//       Checkuser
          'sysop': '158570370817851394',//            Administrator
          'interface-admin': '1371523778580058276',// Interface Editor
          //'superuser': '192423015076724737',//        Superuser
          //'ddowikivip': '158573112785371136',//       DDOwikiVIP
          'user': '167717111739842562',//             Editor
          '*': '219161619761070082',//                Reader
          'blocked': '343438445927989249'//           Blocked editor
        };
        const linkCode = options.getString( 'link-code', true ).toLowerCase();
        if ( !linkCode ) { return interaction.editReply( { content: 'No `«Link Code»` detected.'  } ); }
        const wikiEpoch = ( ( new Date( '2006-01-01T00:00:00Z' ) ) - ( new Date( '1970-01-01T00:00:00Z' ) ) );
        if ( isNaN( parseInt( linkCode, 16 ) ) ) { return interaction.editReply( { content: 'Invalid `«Link Code»` detected.'  } ); }
        interaction.editReply( { content: 'Processing: `' + linkCode + '`'  } );
        const wgUserSnowflake = BigInt( '0x' + linkCode );
        const binSnowflake = wgUserSnowflake.toString( 2 ).padStart( 64, '0' ).match( /([01]{42})([01]{5})([01]{17})/ );
        const binUserRegisteredTimestamp = parseInt( binSnowflake[ 1 ], 2 );
        const dateUserRegistered = ( new Date( wikiEpoch + binUserRegisteredTimestamp ) );
        const intCheckDigit = parseInt( binSnowflake[ 2 ], 2 )
        const validCheckDigit = ( new Date( dateUserRegistered.getFullYear(), ( dateUserRegistered.getMonth() + 1 ), 0 ) ).getDate();
        const isValidCheckDigit = ( intCheckDigit == validCheckDigit );
        const wikiUserId = parseInt( binSnowflake[ 3 ], 2 );

        if ( isValidCheckDigit ) {
          var userParams = {
            action: 'query',
            format: 'json',
            list: 'users',
            usprop: 'blockinfo|emailable|gender|groups|registration',
            ususerids: wikiUserId
          };
          var fetchUserURL = ddoWikiApiEndpoint;
          Object.keys( userParams ).forEach( key => { fetchUserURL += '&' + encodeURIComponent( key ) + '=' + encodeURIComponent( userParams[ key ] ); } );
          console.log( 'fetchUserURL: %o', fetchUserURL );
          fetch( fetchUserURL ).then( resUserData => { return resUserData.json(); } )
            .then( resUserData => {
              console.log( 'json data: %o', resUserData );
              var username = resUserData.query.users[ 0 ].name;
              var jsonParams = {
                action: 'query',
                prop: 'revisions',
                format: 'json',
                formatversion: '2',
                rvdir: 'older',
                rvlimit: 1,
                rvprop: 'content|contentmodel|user|userid',
                rvslots: 'main',
                titles: 'User:' + username + '/Discord.json'
              }
              var fetchJsonURL = ddoWikiApiEndpoint;
              Object.keys( jsonParams ).forEach( key => { fetchJsonURL += '&' + key + '=' + jsonParams[ key ]; } );
              console.log( 'fetchJsonURL: %o', fetchJsonURL );
              fetch( fetchJsonURL )
                .then( resJsonData => { return resJsonData.json(); } )
                .then( resJsonData => {
                  console.log( 'json data: %o', resJsonData );
                  if ( resJsonData.query.pages[ 0 ].missing ) { return interaction.editReply( 'There\'s nothing on your configuration page.  Please follow the instructions from running `/user link` again or contact an Administrator for assistance.' ); }
                  //const objConfig = JSON.parse( resJsonData.query.pages[ 0 ].revisions[ 0 ].slots.main.content.replace( /[\n\t]/g, '' ).replace( /\\[^\\]/g, '' ) );
                  //console.log( 'Discord.json as an obj:\n%o', objConfig );
                  return interaction.editReply( 'Welcome wiki user `' + wikiUserId + '` since `' + dateUserRegistered + '`.' );
                } )
                .catch( error => { console.error( 'Error fetching User:.../Discord.json validation data: %o', error ); } );
            } )
            .catch( error => { console.error( 'Error fetching user validation data: %o', error ); } );
        }
        // The bot should update [[User:Username/Discord.json]] with guilds --> nickname, roles, join date, etc
        else {
          console.log( 'linkCode failed: %o\nUser Registered: %o\nCheck Digit: %o %o\nUser ID: %o', linkCode, dateUserRegistered, intCheckDigit, wikiUserId );
          return interaction.editReply( 'Invalid `«Link Code»` detected...' );
        }
      break; }
      case 'set': {
        return interaction.editReply( 'Not yet available.  Please try again later.' );
        break; }
      case 'update': {
        return interaction.editReply( 'Not yet available.  Please try again later.' );
        break; }
      default:
        return interaction.editReply( 'Please select one of `/user link`, `/user validate`, or `/user set`.' );
      }
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};