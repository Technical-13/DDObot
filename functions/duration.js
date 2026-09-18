const bot = require( '..' );
const { buildPath } = bot;
const modData = buildPath( { name: 'duration', type: 'functions' } );

/**
 * Formats a duration in milliseconds into a human-readable, natural-language string.
 * Supports type-shifting signatures for flexible parameter handling and strict defensive validation.
 *
 * @param {number}                            ms - The total duration in milliseconds to be evaluated.
 * @param {Object}  [ getUnits         =    {} ] - The configuration object to toggle time-unit outputs.
 * @param {boolean} [ getUnits.getXs   = false ] - Include decades in the string.
 * @param {boolean} [ getUnits.getYrs  = false ] - Include years in the string.
 * @param {boolean} [ getUnits.getMos  = false ] - Include months in the string.
 * @param {boolean} [ getUnits.getWks  = false ] - Include weeks in the string.
 * @param {boolean} [ getUnits.getDays =  true ] - Include days in the string.
 * @param {boolean} [ getUnits.getHrs  =  true ] - Include hours in the string.
 * @param {boolean} [ getUnits.getMins =  true ] - Include minutes in the string.
 * @param {boolean} [ getUnits.getSecs = false ] - Include seconds in the string.
 * @param {boolean} [ getUnits.getMs   = false ] - Include remaining milliseconds.
 * @param {boolean} [ debug            = false ] - Toggles descriptive console.debug tracking reports.
 * @returns {string} The formatted duration string (e.g., '3 days, 4 hours, and 12 minutes').
 *
 * @example
 * // Standard call with defaults (Days, Hours, Minutes enabled)
 * duration( 275400000 ); // Returns: '3 days, 4 hours, and 30 minutes'
 *
 * @example
 * // Type-shifted signature bypassing the unit object to toggle debugging directly
 * duration( 60000, true ); // Evaluates as duration( 60000, {}, true )
 */
module.exports = ( ms, getUnits = {}, debug = false ) => {
  try {
    if ( isNaN( ms ) ) { return '∅ms'; }
    if ( arguments.length === 2 && getUnits.constructor.name !== 'Object' && typeof getUnits === 'boolean' ) {
      debug = getUnits;
      getUnits = {};
    }
    if ( getUnits.constructor.name !== 'Object' ) { getUnits = {}; }
    const {// !getXs, !getYrs, !getMos, !getWks, getDays, getHrs, getMins, !getSecs, !getMs } = getUnits;
      getXs = false, getYrs = false, getMos = false, getWks = false,
      getDays = true, getHrs = true, getMins = true, getSecs = false, getMs = false
    } = getUnits;
    getXs = ( typeof getXs !== 'boolean' ? false : getXs );
    getYrs = ( typeof getYrs !== 'boolean' ? false : getYrs );
    getMos = ( typeof getMos !== 'boolean' ? false : getMos );
    getWks = ( typeof getWks !== 'boolean' ? false : getWks );
    getDays = ( typeof getDays !== 'boolean' ? true : getDays );
    getHrs = ( typeof getHrs !== 'boolean' ? true : getHrs );
    getMins = ( typeof getMins !== 'boolean' ? true : getMins );
    getSecs = ( typeof getSecs !== 'boolean' ? false : getSecs );
    getMs = ( typeof getMs !== 'boolean' ? false : getMs );

    if ( getXs || getYrs || getMos || getWks || getDays || getHrs || getMins || getSecs || getMs ) {
      var intDecades = 0, intYears = 0, intMonths = 0, intWeeks = 0, intDays = 0, intHours = 0, intMinutes = 0, intSeconds = 0;
      var totalSeconds = ( ms / 1000 );
      if ( getXs ) {
        intDecades = Math.floor( totalSeconds / 315569520 );
        totalSeconds %= 315569520;
        ms %= 315569520000;
      }
      if ( getYrs ) {
        intYears = Math.floor( totalSeconds / 31556952 );
        totalSeconds %= 31556952;
        ms %= 31556952000;
      }
      if ( getMos ) {
        intMonths = Math.floor( totalSeconds / 2629746 );
        totalSeconds %= 2629746;
        ms %= 2629746000;
      }
      if ( getWks ) {
        intWeeks = Math.floor( totalSeconds / 604800 );
        totalSeconds %= 604800;
        ms %= 604800000;
      }
      if ( getDays ) {
        intDays = Math.floor( totalSeconds / 86400 );
        totalSeconds %= 86400;
        ms %= 86400000;
      }
      if ( getHrs ) {
        intHours = Math.floor( totalSeconds / 3600 );
        totalSeconds %= 3600;
        ms %= 3600000;
      }
      if ( getMins ) {
        intMinutes = Math.floor( totalSeconds / 60 );
        ms %= 60000;
      }
      if ( getSecs ) {
        intSeconds = Math.floor( totalSeconds % 60 );
        if ( getMs ) {
          intSeconds += ( ms - ( intSeconds * 1000 ) ) / 1000;
        }
      }
      if ( debug ) {// Display integers figured out above
        const objIntegers = {
          intDecades: intDecades, intYears: intYears,
          intMonths: intMonths, intWeeks: intWeeks, intDays: intDays,
          intHours: intHours, intMinutes: intMinutes, intSeconds: intSeconds };
        console.debug( '%s integers: %o', modData.path, objIntegers );
      }

      const result = [];
      if ( getXs && intDecades !== 0 ) { result.push( intDecades + ' decade' + ( intDecades === 1 ? '' : 's' ) ); }
      if ( getYrs && intYears !== 0 ) { result.push( intYears + ' year' + ( intYears === 1 ? '' : 's' ) ); }
      if ( getMos && intMonths !== 0 ) { result.push( intMonths + ' month' + ( intMonths === 1 ? '' : 's' ) ); }
      if ( getWks && intWeeks !== 0 ) { result.push( intWeeks + ' week' + ( intWeeks === 1 ? '' : 's' ) ); }
      if ( getDays && intDays !== 0 ) { result.push( intDays + ' day' + ( intDays === 1 ? '' : 's' ) ); }
      if ( getHrs && intHours !== 0 ) { result.push( intHours + ' hour' + ( intHours === 1 ? '' : 's' ) ); }
      if ( getMins && intMinutes !== 0 ) { result.push( intMinutes + ' minute' + ( intMinutes === 1 ? '' : 's' ) ); }
      if ( getSecs && intSeconds !== 0 ) { result.push( intSeconds + ' second' + ( intSeconds === 1 ? '' : 's' ) ); }
      if ( debug ) { console.debug( '%s result array: %o', modData.path, result ); }

      var strResult;
      switch ( result.length ) {
        case 0: strResult = ms + 'ms'; break;
        case 1: strResult = result[ 0 ]; break;
        case 2: strResult = result.join( ' and ' ); break;
        default:
          const lastIncrement = result.pop();
          strResult = result.join( ', ' ) + ', and ' + lastIncrement;
      }
      return strResult;
    }
    else { return ms + 'ms'; }
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', modData.path, errObject.stack ); }
};