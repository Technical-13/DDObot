const bot = require( '..' );
const { buildPath, parser } = bot;
const modData = buildPath( { name: 'getResponses', type: 'i18n' } );

/**
 * Processes raw translation asset strings through the template token parser utility
 * to dynamically inject active variables, parameters, and environment context maps.
 *
 * @param {Array|Object} responses - The raw response string mapping array or dictionary object from locale JSON files.
 * @param {string} [langCode='en-US'] - The active target language fallback code to store the string under.
 * @param {Object} [objRes={}] - The accumulator object containing calculated strings across languages.
 * @param {Object} params - The context tracking block passed directly to the core variable parsing utility.
 * @param {boolean} [debug=false] - Toggles descriptive error logging output rules for broken transclusion templates.
 * @returns {Object} The compiled dictionary mapping keys to their finalized, token-replaced string values.
 *
 * @example
 * // Parses a raw response array and hooks it directly into the execution context payload
 * getResponses( langFile.responses, 'en-US', {}, currentExecutionParams, false );
 */
module.exports = ( responses, langCode = 'en-US', objRes = {}, params, debug = false ) => {
  if ( !responses ) { return { error: 'No responses to get data for in: ' + modData.path }; }
  if ( responses.constructor.name === 'Object' ) { responses = Object.entries( responses ); };
  if ( !Array.isArray( responses ) ) { return { error: 'Unable to manipulate responses of type "' + typeof responses + '" into an array to get data for in: ' + modData.path }; }
  if ( !langCode ) { return { error: 'No langCode to get data for in: ' + modData.path }; }

  responses.forEach( ( res ) => {
    objRes[ res[ 0 ] ] = ( objRes[ res[ 0 ] ] ?? {} );
    const resBuilder = objRes[ res[ 0 ] ];
    resBuilder[ langCode ] = parser( res[ 1 ], params, debug );
    if ( resBuilder[ langCode ]?.error ) {
      console.error( 'getI18n %s: %s', resBuilder[ langCode ].message, resBuilder[ langCode ].string );
      resBuilder[ langCode ] = resBuilder[ langCode ].string;
    }
  } );
  return objRes;
}