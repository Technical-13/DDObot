const config = require( '../../config.json' );
const ddoWikiApiEndpoint = 'https://ddowiki.com/api.php';
const wmfWikiEndpoint = 'https://api.wikimedia.org/w/api.php?origin=*';
const chalk = require( 'chalk' );
const { ApplicationCommandType, InteractionContextType } = require( 'discord.js' );
const getGuildConfig = require( '../../functions/getGuildDB.js' );
const userPerms = require( '../../functions/getPerms.js' );
const strScript = chalk.hex( '#FFA500' ).bold( './slashCommands/wiki/lamannia.js' );

const isDst = new Date().getHours() !== new Date( new Date().getFullYear(), 0, 1 ).toLocaleString( 'en-US', { timeZone: 'America/New_York' } ).split( ', ' )[ 1 ].split( ':' )[ 0 ];
const validateInput = async function ( input, offset = 4 + ( isDst ? 0 : 1 ) ) {
  var validateInputURL = wmfWikiEndpoint;
  const params = {
    action: 'parse',
    disablelimitreport: 1,
    contentmodel: 'wikitext',
    format: 'json',
    formatversion: '2',
    text: '{'+'{#time:c|' + input + ( offset === 0 ? '' : ( offset < 0 ? ' ' : ' +' ) + offset + ' hours' ) + '}'+'}'
  };
  Object.keys( params ).forEach( key => { validateInputURL += '&' + encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ); } );
  /* TRON */console.log( 'Querying mw-api for timestamp with query: %s', validateInputURL );/* TROFF */
  return fetch( validateInputURL ).then( resParsedData => { return resParsedData.json(); } ).then( data => {
    if ( data.parse.text.includes( 'Invalid time' ) ) {
      return 'INVALID';
    }
    else {
      return data.parse.text.match( /<p>(20[\d]{2}-[01][\d]-[0-3][\d]T[0-6][\d]:[0-6][\d]:[0-6][\d]\+[0-6][\d]:[0-6][\d])\n<\/p>/ )[ 1 ];
    }
  } ).catch( parseErr => {
    console.log( 'Error attempting to validateInput( \'%s\' ) with params: %o\nReturned: %o ', input, params, parseErr );
    return 'ERROR';
  } );
}

const getToken = async function ( type = '*' ) {
  type = type.toLowerCase();
  switch( type ) {
    case '*': case 'createaccount': case 'csrf': case 'login': case 'patrol': case 'rollback': case 'userrights': case 'watch': break;
    default : return 'ERROR'
  }
  var getTokenURL = ddoWikiApiEndpoint;
  const params = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    meta: 'tokens',
    type: type
  };
  Object.keys( params ).forEach( ( key, i ) => { getTokenURL += ( i === 0 ? '?' : '&' ) + encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ); } );
  /* TRON */console.log( 'Querying ddowiki-api for login token with query: %s', getTokenURL );/* TROFF */
  return fetch( getTokenURL ).then( resFetchedData => { return resFetchedData.json(); } ).then( data => {
    if ( Object.keys( data.warnings ?? {} ).length !== 0 ) {
      console.log( 'Error attempting to getToken( \'%s\' ) with params: %o\nReturned: %o ', type, params, data.warnings );
      return 'INVALID';
    }
    else if ( type === '*' ) { return data.query.tokens; }
    else { return data.query.tokens[ type + 'token' ]; }
  } ).catch( parseErr => {
    console.log( 'Error attempting to getToken( \'%s\' ) with params: %o\nReturned: %o ', type, params, parseErr );
    return 'ERROR';
  } );
}

const isLoggedIn = async function () {
  var getDataURL = 'https://ddowiki.com/api.php';
  const params = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    meta: 'userinfo'
  };
  Object.keys( params ).forEach( ( key, i ) => { getDataURL += ( i === 0 ? '?' : '&' ) + encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ); } );
  /* TRON */console.log( 'Querying ddowiki-api for login token with query: %s', getDataURL );/* TROFF */
  return fetch( getDataURL ).then( resFetchedData => { return resFetchedData.json(); } ).then( data => {
      return ( data.query.userinfo.id ? true : false );
  } ).catch( dataErr => {
    console.error( 'dataErr: %o', dataErr );
    return 'ERROR';
  } );
}

const getWikiNames = async function ( wikiUsername ) {
  var fetchUsersURL = ddoWikiApiEndpoint;
  var auParams = {
    req: {
      //origin: '*',
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
  var auResults = ( auParams ) => {
    if ( !auParams.rawcontinue ) { return auParams.auArray; }
    Object.keys( auParams.req ).forEach( ( key, i ) => { fetchUsersURL += ( i === 0 ? '?' : '&' ) + encodeURIComponent( key ) + '=' + encodeURIComponent( auParams.req[ key ] ); } );
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

const getWikiPage = async function ( pagename ) {
  var getPageURL = ddoWikiApiEndpoint;
  const params = {
    origin: '*',
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'revisions',
    rvlimit: '1',
    rvprop: 'content',
    rvslots: 'main',
    titles: pagename
  };
  Object.keys( params ).forEach( ( key, i ) => { getPageURL += ( i === 0 ? '?' : '&' ) + encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ); } );
  /* TRON */console.log( 'Querying ddowiki-api for page contents with query: %s', getPageURL );/* TROFF */
  return fetch( getPageURL ).then( resFetchedData => { return resFetchedData.json(); } ).then( data => {
    if ( data.query.pages[ 0 ].missing ) {
      return 'INVALID';
    }
    else {
      return data.query.pages[ 0 ].revisions[ 0 ].slots.main.content;
    }
  } ).catch( parseErr => {
    console.log( 'Error attempting to getWikiPage( \'%s\' ) with params: %o\nReturned: %o ', pagename, params, parseErr );
    return 'ERROR';
  } );
}

module.exports = {
  name: 'lamannia',
  description: 'Mark Lamannia preview server as online on Discord and on DDOwiki.',
  type: ApplicationCommandType.ChatInput,
  contexts: [ InteractionContextType.Guild ],
  group: 'wiki',
  devOnly: true,
  options: [
    { type: 3, name: 'open', description: 'What is the date/time Lamannia is supposed to/did open?' },
    { type: 3, name: 'close', description: 'What is the date/time Lamannia is supposed to/did close?' },
    { type: 10, name: 'offset', min_value: -12, max_value: 14,
      description: 'The offset for your timezone. (EG +' + ( isDst ? '4' : '5' ) + ' for Eastern ' + ( isDst ? 'Daylight' : 'Standard' ) + ' Time)'
    }
  ],
  cooldown: 1000,
  run: async ( client, interaction ) => {
    await interaction.deferReply( { ephemeral: true } );
    const { channel, guild, options, user: member } = interaction;
    const { isGlobalBlacklisted, content } = await userPerms( member, guild );
    if ( content ) { return interaction.editReply( { content: content } ); }

    try {
      const offset = ( options.getNumber( 'offset' ) ?? 4 + ( isDst ? 0 : 1 ) );
      const strOpen = ( options.getString( 'open' ) ?? 'now' );
      const isoOpen = await validateInput( strOpen, offset );
      if ( isoOpen === 'INVALID' ) { return interaction.editReply( { content: 'I am unable to parse a date or time from `' + strOpen + '`.  Please try again.' } ); }
      if ( isoOpen === 'ERROR' ) { return interaction.editReply( { content: 'I encountered an error attempting to parse a date or time from `' + strOpen + '`.  Please try again later.' } ); }
      const strClose = ( options.getString( 'close' ) ?? 'tomorrow' );
      const isoClose = await validateInput( strClose, offset );
      if ( isoClose === 'INVALID' ) { return interaction.editReply( { content: 'I am unable to parse a date or time from `' + strClose + '`.  Please try again.' } ); }
      if ( isoClose === 'ERROR' ) { return interaction.editReply( { content: 'I encountered an error attempting to parse a date or time from `' + strClose + '`.  Please try again later.' } ); }
      interaction.editReply( { content: 'Processing your request...' } );
      const newDateString = '<!-- DDObot -->{{#vardefine:open|' + isoOpen + '}}{{#vardefine:close|' + isoClose + '}}<!-- DDObot -->';
      const tLamaStatusContent = await getWikiPage( 'Template:Lamannia status' );
      console.log( 'tLamaStatusContent: %o', tLamaStatusContent );
      const newLamaStatus = tLamaStatusContent.replace( /<!-- DDObot -->(.*?)<!-- DDObot -->/, newDateString );
      console.log( 'newLamaStatus: %o', newLamaStatus );
      /* TBD */
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};