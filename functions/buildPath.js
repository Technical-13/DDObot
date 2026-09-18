const bot = require( '..' );
const { err } = bot;
const modData = { ext: 'js', file: 'buildPath.js', name: 'buildPath', path: './functions/buildPath.js', type: 'functions' };

/**
 * Loaded into bot.buildPath in index.js
 * Resolves a structured object into a standard relative file path string.
 * Used primarily for mapping module, command, and handler locations.
 *
 * @param {Object} objPath - The path configuration object.
 * @param {string} [objPath.ext='js'] - The file extension (css, html, js, json, ...)
 * @param {string} [objPath.group=''] - The command group name (admin, chat, fun, info, ...)
 * @param {string} [objPath.name=''] - The base name of the file.
 * @param {string} [objPath.platform=''] - The platform name (ddo, ddoForums, discord, mediawiki, mongodb, ...)
 * @param {string} [objPath.type=''] - The type of method (functions, methods, models, ...)
 * @returns {string} The constructed relative path string (e.g., './platform/type/group/name.ext').
 *
 * @example
 * // Returns: './discord/handlers/ready.js'
 * buildPath( { name: 'ready', platform: 'discord', type: 'handlers' } );
 *
 * @example
 * // Returns: './bot/foo/bar/baz.example'
 * buildPath( { ext: 'example', group: 'bar', name: 'baz', platform: 'bot', type: 'foo' } );
 */
module.exports = ( objPath = {} ) => {
  const { ext = 'js', group, name, platform, type } = objPath;
  if ( !name ) { throw new Err( '"name" is required to buildPath()' ); }
  const top = platform ? platform + '/' : '';
  const cat = type ? type + '/' : '';
  const sub = group ? group + '/' : '';
  const file = name + '.' + ext;
  const path = './' + top + cat + sub + file;
  return { ext: ext, file: file, path: path, ...objPath };
};