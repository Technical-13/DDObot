const bot = require( '..' );
const { buildPath } = bot;
const modData = buildPath( { name: 'getOptions', type: 'i18n' } );

/**
 * Recursively maps and formats localized names, descriptions, nested subsets, and custom parameter arrays
 * across platforms into a clean, language-keyed multi-dimensional object structure.
 *
 * @param {Array|Object} options - The structural configuration array or object entries to parse and map.
 * @param {string} [langCode='en-US'] - The specific target language code (e.g., 'es-ES', 'fr').
 * @param {Object} [objOpt={}] - The accumulator object managing active localizations across recursive iterations.
 * @returns {Object} The aggregated multi-dimensional localization configuration matrix.
 *
 * @example
 * // Appends 'fr' localizations onto an existing abstract option structure
 * getOptions( configurationMatrix, 'fr', accumulatedOptions );
 */
const getOptions = ( options, langCode = 'en-US', objOpt = {} ) => {
  if ( !options ) { return { error: 'No options to get data for in: ' + modData.path }; }
  if ( options.constructor.name === 'Object' ) { options = Object.entries( options ); };
  if ( !Array.isArray( options ) ) { return { error: 'Unable to manipulate options of type "' + typeof options + '" into an array to get data for in: ' + modData.path }; }
  if ( !langCode ) { return { error: 'No langCode to get data for in: ' + modData.path }; }

  options.forEach( opt => {
    objOpt[ opt[ 0 ] ] = ( objOpt[ opt[ 0 ] ] ?? { name: {}, description: {} } );
    const optBuilder = objOpt[ opt[ 0 ] ];
    const data = opt[ 1 ];
    optBuilder.name[ langCode ] = data.name;
    optBuilder.description[ langCode ] = data.description;
    if ( data.options ) { optBuilder.options = getOptions( data.options, langCode ); }
    if ( data.choices ) {
      if ( !optBuilder.choices ) {
        optBuilder.choices = [];
        let intLastChoice = ( data.choices.length - 1 );
        for ( intLastChoice; intLastChoice >= 0; intLastChoice-- ) { optBuilder.choices.push( {} ); }
      }
      data.choices.forEach( ( choice, ndx ) => { optBuilder.choices[ ndx ][ langCode ] = choice; } );
    }
  } );
  return objOpt;
};

module.exports = getOptions;