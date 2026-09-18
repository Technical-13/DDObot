const bot = require( '..' );
const { buildPath } = bot;
const modData = buildPath( { name: 'getInternationalizations', type: 'functions' } );

module.exports = () => {
  const modPaths = {
    getOptions: buildPath( { name: 'getOptions', type: 'i18n' } ).path,
    getResponses: buildPath( { name: 'getResponses', type: 'i18n' } ).path,
    discordSlasher: buildPath( { name: 'i18nSlasher', platform: 'discord', type: 'functions' } ).path
  };
  return {
    getOptions: require( modPaths.getOptions ),
    getResponses: require( modPaths.getResponses ),
    discordSlasher: require( modPaths.discordSlasher )
  };
}