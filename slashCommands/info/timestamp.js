const config = require( '../../config.json' );
const wmfWikiEndpoint = 'https://api.wikimedia.org/w/api.php?origin=*';
const chalk = require( 'chalk' );
const { ApplicationCommandType, InteractionContextType } = require( 'discord.js' );
const getGuildConfig = require( '../../functions/getGuildDB.js' );
const userPerms = require( '../../functions/getPerms.js' );
const strScript = chalk.hex( '#FFA500' ).bold( './slashCommands/info/timestamp.js' );

const isDst = new Date().getHours() !== new Date( new Date().getFullYear(), 0, 1 ).toLocaleString( 'en-US', { timeZone: 'America/New_York' } ).split( ', ' )[ 1 ].split( ':' )[ 0 ];
const validateInput = async function ( input, offset = 4 + ( isDst ? 0 : 1 ) ) {
  var validateInputURL = wmfWikiEndpoint;
  const params = {
    action: 'parse',
    format: 'json',
    text: '{'+'{#time:U|' + input + ( offset === 0 ? '' : ( offset < 0 ? ' ' : ' +' ) + offset + ' hours' ) + '}'+'}',
    disablelimitreport: 1,
    contentmodel: 'wikitext',
    formatversion: '2'
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

module.exports = {
  name: 'timestamp',
  description: 'Get dynamic timestamps for Discord.',
  type: ApplicationCommandType.ChatInput,
  contexts: [ InteractionContextType.Guild ],
  group: 'info',
  options: [
    { type: 3, name: 'datetime', description: 'When do you want a timestamp for? (default `now`)' },
    { type: 10, name: 'offset', min_value: -12, max_value: 14,
      description: 'The offset for your timezone. (EG +' + ( isDst ? '4' : '5' ) + ' for Eastern ' + ( isDst ? 'Daylight' : 'Standard' ) + ' Time'
    },
    { type: 3, name: 'format', description: 'Full output or a single format (for easier copy/paste)', choices: [
      { name: 'Full output with all options', value: 'a' },
      { name: 'Relative value such as `in 3 days`', value: 'R' },
      { name: 'Long date/time such as `Monday, July 21, 2025 7:55 AM`', value: 'F' },
      { name: 'Short date/time such as `July 21, 2025 7:55 AM`', value: 'f' },
      { name: 'Long date such as `July 21, 2025`', value: 'D' },
      { name: 'Short date such as `7/21/2025`', value: 'd' },
      { name: 'Long time such as `7:55:31 AM`', value: 'T' },
      { name: 'Short time such as `7:55 AM`', value: 't' }
    ] }
  ],
  cooldown: 1000,
  run: async ( client, interaction ) => {
    await interaction.deferReply( { ephemeral: true } );
    const { channel, guild, options, user: member } = interaction;
    const { isGlobalBlacklisted, content } = await userPerms( member, guild );
    if ( content ) { return interaction.editReply( { content: content } ); }

    try {
      const input = ( options.getString( 'datetime' ) ?? 'now' );
      const format = ( options.getString( 'format' ) ?? 'a' );
      const timestamp = await validateInput( input );
      if ( timestamp === 'INVALID' ) { return interaction.editReply( { content: 'I am unable to parse a date or time from `' + input + '`.  Please try again.' } ); }
      if ( timestamp === 'ERROR' ) { return interaction.editReply( { content: 'I encountered an error attempting to parse a date or time from `' + input + '`.  Please try again later.' } ); }
      const t = '<t:' + timestamp + ':t>', T = '<t:' + timestamp + ':T>';
      const d = '<t:' + timestamp + ':d>', D = '<t:' + timestamp + ':D>';
      const f = '<t:' + timestamp + ':f>', F = '<t:' + timestamp + ':F>';
      const R = '<t:' + timestamp + ':R>';
      switch ( format ) {
        case 'R': return interaction.editReply( { content: '`' + R + '`' } ); break;
        case 't': return interaction.editReply( { content: '`' + t + '`' } ); break;
        case 'd': return interaction.editReply( { content: '`' + d + '`' } ); break;
        case 'f': return interaction.editReply( { content: '`' + f + '`' } ); break;
        case 'T': return interaction.editReply( { content: '`' + T + '`' } ); break;
        case 'D': return interaction.editReply( { content: '`' + D + '`' } ); break;
        case 'F': return interaction.editReply( { content: '`' + F + '`' } ); break;
        case 'a': default:
          return interaction.editReply( { content:
            'Your timestamps for `' + input + '` are as follows:\n\n' +
            '`' + t + '` :arrow_right: ' + t + '\n' + '`' + T + '` :arrow_right: ' + T + '\n' +
            '`' + d + '` :arrow_right: ' + d + '\n' + '`' + D + '` :arrow_right: ' + D + '\n' +
            '`' + f + '` :arrow_right: ' + f + '\n' + '`' + F + '` :arrow_right: ' + F + '\n' +
            '`' + R + '` :arrow_right: ' + R
          } );
      }
    }
    catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', strScript, errObject.stack ); }
  }
};