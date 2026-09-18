const bot = require( '..' );
const { buildPath } = bot;
const modData = buildPath( { name: 'parser', type: 'functions' } );

module.exports = () => {
  const modPaths = {
    discord: buildPath( { name: 'parser', platform: 'discord', type: 'functions' } ).path
  };
  return {
    discord: require( modPaths.discord )
  };
}