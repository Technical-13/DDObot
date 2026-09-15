const modData = { name: 'getInternationalizations', type: 'functions' };
const bot = require( '..' );
const { chalk, fs } = bot;
const { Locale } = require( 'discord-api-types/v10' );
//const parse = require( './parser.js' );
//const strScript = chalk.hex( '#FFA500' ).bold( getModPath( modData ) );

const enNames = new Intl.DisplayNames( [ 'en-US' ], { type: 'language' } );
const objDefaults = { author: null, getLocales: false, guild: null, interaction: null, member: null, uptime: null, useLang: null };