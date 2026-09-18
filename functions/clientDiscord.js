const bot = require( '..' );
const { buildPath, chalk, config, djs, env, fs } = bot;
const modData = buildPath( { name: 'clientDiscord', type: 'functions' } );
const { discord } = config;
const { Client, Collection, GatewayIntentBits, Partials } = djs;
const { token } = env;

module.exports = async ( persona ) => {
  try {
    const client = new Client( {// intents: [], partials: [] } );
      intents: [
        'DirectMessages', 'Guilds', 'GuildMessages', 'GuildPresences', 'GuildMessageReactions', 'GuildMembers', 'MessageContent'
      ].map( k => GatewayIntentBits[ k ] ),
      partials: [ 'Channel', 'GuildMember', 'Message', 'Reaction', 'User' ].map( k => Partials[ k ] )
    } );

    client.aliases = new Collection();
    client.commands = new Collection();
    client.groups = new Collection();
    client.events = new Collection();
    client.ownerId = ( discord.botOwnerId );
    client.prefix = persona.prefix ?? discord.prefix;
    client.slashCommands = new Collection();

    const staticCmds = [ ...discord.staticCmds, ...persona.staticCmds ];
    staticCmds.push( 'admin' );
    client.groups.set( 'staticCmds', staticCmds );

    fs.readdirSync( './handlers' ).forEach( ( H ) => { require( './handlers/' + H )( client ); } );

    const isConnected = await client.login( token ).then( loggedIn => {
      console.log( '%s is successfully connected!', persona.botName );
      return true;
    } ).catch( errLogin => {
      console.error( 'There was an error attempting to log %s in:\n%s', persona.botName, errLogin.stack );
      return false;
    } );

    if ( isConnected ) { return client; }
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', chalk.hex( '#FFA500' ).bold( buildPath( modData ).path ), errObject.stack ); }
}