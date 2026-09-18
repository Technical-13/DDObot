const bot = require( '..' );
const { buildPath, chalk, fs, i18n } = bot;
const modData = buildPath( { name: 'i18nSlasher', platform: 'discord', type: 'functions' } );
const { getOptions, getResponses } = i18n;
const { Locale } = require( 'discord-api-types/v10' );

const enNames = new Intl.DisplayNames( [ 'en-US' ], { type: 'language' } );
const objDefaults = {// author, getLocales, guild, interaction, member, uptime, useLang },
  author: null,
  getLocales: false,
  guild: null,
  interaction: {// channel, guild, locale, options, user },
    channel: null,
    guild: null,
    locale: null,
    options: null,
    user: null
  },
  member: null,
  uptime: null,
  useLang: null
};

module.exports = ( client, command, params = objDefaults, debug = false ) => {
  try {
    const interaction = params.interaction;
    const { channel, guild: iGuild, locale: iLocale, options, user } = interaction;
    const langCodes = Object.values( Locale );
    if ( params.getLocales ) {
      const langNames = Object.keys( Locale );
      locales = {};
      langCodes.forEach( ( v, k ) => { locales[ v ] = enNames.of( v ); } );
      if ( !command ) { return locales; }
    }
    if ( !command ) { throw new Error( 'No command to get localizations for.' ); }

    const cmd = ( client ? client[ command.type ].get( command.name ) : command );
    const author = ( params.author ?? ( user ?? null ) );
    const member = ( params.member ?? null );
    const guild = ( params.guild ?? ( iGuild ?? ( author ? author.guild : ( member ? member.guild : null ) ) ) );
    const respMsg = ( params.respMsg ?? null );
    const useLang = ( params.useLang ?? options?.getString( 'language' ) ?? iLocale ?? guild?.preferedLocale ?? 'en-US' );
    const resParams = { author: author, channel: channel, command: cmd, guild: guild, interaction: interaction, member: member, respMsg: respMsg, useLang: useLang };

    const i18n = { langs: [], name: {}, description: {} };
    if ( params.getLocales ) { i18n.locales = locales }
    const files = fs.readdirSync( './i18n/' ).filter( file => file.endsWith( '.json' ) );
    i18n.langs = files.map( file => file.replace( '.json', '' ) );
    i18n.langs.forEach( ( langCode ) => {
      const currLangFilePath = buildPath( { ext: 'json', name: langCode, type: 'i18n' } ).path;
      const currLangFile = require( currLangFilePath );
      if ( !currLangFile[ command.type ] ) { console.info( chalk.hex( '#FFFFAA' ).bold( currLangFilePath + ' has no data for ' + command.type + 's.' ) ); }
      else if ( !currLangFile[ command.type ][ command.group ] ) { console.info( chalk.hex( '#FFFFAA' ).bold( currLangFilePath + ' has no data for the ' + command.group + command.type + ' group.' ) ); }
      else if ( !currLangFile[ command.type ][ command.group ][ command.name ] ) { console.info( chalk.hex( '#FFFFAA' ).bold( currLangFilePath + ' has no data for the ' + command.name + command.type + '.' ) ); }
      else {
        const cmdPath = currLangFile[ command.type ][ command.group ][ command.name ];
        if ( langCodes.indexOf( langCode ) === -1 ) { console.warn( chalk.bold( langCode + ' is a language code not currently supported by Discord.' ) ); }
        else {
          i18n.name[ langCode ] = cmdPath.name;
          i18n.description[ langCode ] = cmdPath.description;
          if ( currLangFile.common.options ) { i18n.options = getOptions( currLangFile.common.options, langCode, i18n.options ); }
          if ( cmdPath.options ) { i18n.options = getOptions( cmdPath.options, langCode, i18n.options ); }
        }
        if ( currLangFile.common.responses ) { i18n.responses = getResponses( currLangFile.common.responses, langCode, i18n.responses, resParams, debug ); }
        if ( cmdPath.responses ) { i18n.responses = getResponses( cmdPath.responses, langCode, i18n.responses, resParams, debug ); }
      }
    } );

    return i18n;
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', modData.path, errObject.stack ); }
};