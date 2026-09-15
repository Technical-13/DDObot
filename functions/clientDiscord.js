const modData = { name: 'clientDiscord', type: 'functions' };
const bot = require( '..' );
const { buildPath, chalk, config, djs, env } = bot;
const { Client, Collection, GatewayIntentBits, Partials } = djs;

try {
  const discord = new Client( {// intents: [], partials: [] } );
    intents: [
      'DirectMessages', 'Guilds', 'GuildMessages', 'GuildPresences', 'GuildMessageReactions', 'GuildMembers', 'MessageContent'
    ].map( k => GatewayIntentBits[ k ] ),
    partials: [ 'Channel', 'GuildMember', 'Message', 'Reaction', 'User' ].map( k => Partials[ k ] )
  } );

  discord.aliases = new Collection();
  discord.commands = new Collection();
  discord.groups = new Collection();
  discord.events = new Collection();
  discord.ownerId = ( config.botOwnerId || env.OWNER_ID );
  discord.prefix = config.prefix;
  discord.slashCommands = new Collection();

  const staticCmds = [ ...config.staticCmds ];
  staticCmds.push( 'admin' );
  discord.groups.set( 'staticCmds', staticCmds );

  module.exports = discord;
}
catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', chalk.hex( '#FFA500' ).bold( buildPath( modData ) ), errObject.stack ); }