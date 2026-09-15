const modData = { name: 'Err', type: 'functions' };
const bot = require( '..' );
/**
 * Custom error class for handling exceptions with attached metadata.
 *
 * @extends {Error}
 */

class Err extends Error {
  /**
   * Creates an instance of Err.
   *
   * @param {string} msg - The human-readable error description.
   * @param {Object.<string, *>} [data={}] - Optional metadata to attach directly to the error instance (e.g., status codes, retry flags).
   */
  constructor( msg, data = {} ) {
    if ( arguments.length === 0 ) { throw new Error( 'ERROR! Err is empty.' ); }
    if ( arguments.length === 1 && msg?.constructor.name === 'Object' ) {
      data = msg;
      msg = 'undefined';
    }
    super( msg );
    Object.assign( this, data );
  }
}

module.exports = Err;