const bot = require( '..' );
const buildPath = require( './functions/buildPath.js' );
const modData = buildPath( { name: 'utils', type: 'functions' } );
// Build as a static list of requires for now - later move the utils to `.\functions\utils\` and load this dynamically.

module.exports = () => {
  const modPaths = {
    buildPath: buildPath( { name: 'buildPath', type: 'functions' } ).path,
    duration: buildPath( { name: 'duration', type: 'functions' } ).path,
    i18n: buildPath( { name: 'getInternationalizations', type: 'functions' } ).path,
    parser: buildPath( { name: 'parser', type: 'functions' } ).path
  };
  return {
    buildPath: require( modPaths.buildPath ),
    duration: require( modPaths.duration ),
    i18n: require( modPaths.i18n ),
    parser: require( modPaths.parser )
  };
}