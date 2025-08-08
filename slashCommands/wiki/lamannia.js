const config = require( '../../config.json' );
const ddoWikiApiEndpoint = 'https://ddowiki.com/api.php?origin=*';
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
      return data.parse.text.match( /<p>([\d]*)\n<\/p>/ )[ 1 ];
    }
  } ).catch( parseErr => {
    console.log( 'Error attempting to validateInput( \'%s\' ) with params: %o\nReturned: %o ', input, params, parseErr );
    return 'ERROR';
  } );
}

const getWikiPage = async function ( pagename ) {
  var getPageURL = ddoWikiApiEndpoint;
  const params = {
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'revisions',
    rvlimit: '1',
    rvprop: 'content',
    rvslots: 'main',
    titles: pagename
  };
  Object.keys( params ).forEach( key => { getPageURL += '&' + encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] ); } );
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
      description: 'The offset for your timezone. (EG +' + ( isDst ? '4' : '5' ) + ' for Eastern ' + ( isDst ? 'Daylight' : 'Standard' ) + ' Time'
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
      const strClose = ( options.getString( 'close', offset ) ?? 'tomorrow' );
      const isoClose = await validateInput( strClose );
      if ( isoClose === 'INVALID' ) { return interaction.editReply( { content: 'I am unable to parse a date or time from `' + strClose + '`.  Please try again.' } ); }
      if ( isoClose === 'ERROR' ) { return interaction.editReply( { content: 'I encountered an error attempting to parse a date or time from `' + strClose + '`.  Please try again later.' } ); }
      interaction.editReply( { content: 'Processing your request...' } );
      const tLamaStatusContent = await getWikiPage( 'Template:Lamannia status' );
      console.log( 'tLamaStatusContent: %o', tLamaStatusContent );
      /* TBD */
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};