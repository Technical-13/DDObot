const modData = { name: 'getBotDB', platform: 'mongodb', type: 'methods' };
const bot = require( '..' );
const { buildPath, chalk, config, discord, env } = bot;
const botConfig = require( buildPath( { ...modData, name: 'BotConfig', type: 'models' } ) );
const verBotDB = config.verBotDB;

module.exports = async () => {
  try {
    const logChans = config?.logChans?.logChans ?? env?.logChans;
    const discordId = ( config?.discordId || env?.DISCORD_ID || discord?.id || null );
    const botOwnerID = ( config.botOwnerId || env.OWNER_ID || null );
    const devGuildId = ( config.devGuildId || env.DEV_GUILD_ID || null );
    const newBot = ( await botConfig.countDocuments( { _id: discordId } ) === 0 ? true : false );
    if ( !newBot ) {
      const currConfig = await botConfig.findOne( { _id: discordId } );
      const configVersion = ( !currConfig.Version ? 0 : currConfig.Version );
      if ( configVersion === verBotDB ) { return currConfig; }
      else {
        const currLogs = ( currConfig.Logs || { Default: logChans?.Default ?? null, Error: logChans?.Error ?? null, JoinPart: logChans?.JoinPart ?? null } );
        const updatedBotConfig = {
          _id: discordId,
          Blacklist: ( currConfig.Blacklist || [] ),
          DevGuild: ( currConfig.DevGuild || devGuildId ),
          IssueRepo: ( currConfig.IssueRepo || config.issueRepo || null ),
          Logs: {
            Default: ( currLogs.Default ),
            Error: ( currLogs.Error ),
            JoinPart: ( currLogs.JoinPart )
          },
          Mods: ( currConfig.Mods || config.moderatorIds || [] ),
          Name: ( currConfig.Name || config.botName || env.BOT_USERNAME ),
          Owner: ( currConfig.Owner || botOwnerID ),
          Prefix: ( currConfig.Prefix || config.prefix || '!' ),
          Verbosity: ( currConfig.Verbosity || env.VERBOSITY || -1 ),
          Version: verBotDB,
          Whitelist: ( currConfig.Whitelist || [] )
        };
        return await botConfig.updateOne( { _id: discordId }, updatedBotConfig, { upsert: true } )
        .then( updateSuccess => { return updatedBotConfig; } )
        .catch( updateError => { throw new Error( chalk.bold.cyan.inverse( 'Error attempting to update bot config in my database:\n%o' ), updateError ); } );
      }
    }
    else if ( newBot && ( !discordId || !botOwnerID || !devGuildId ) ) {
      let missingRequired = ' missing attempting to initialize bot configuration in my database. Please add it to config.js and/or .env and try again.';
      if ( !discordId ) { throw new Error( chalk.bold.redBright( 'discordId' + missingRequired ) ); }
      if ( !botOwnerID ) { throw new Error( chalk.bold.redBright( 'botOwnerID' + missingRequired ) ); }
      if ( !devGuildId ) { throw new Error( chalk.bold.redBright( 'devGuildId' + missingRequired ) ); }
    }
    else {
      console.log( 'Initializing bot in database...' );
      const newBotConfig = {
        _id: discordId,
        Blacklist: [],
        DevGuild: devGuildId,
        IssueRepo: ( config.issueRepo || null ),
        Logs: {
          Default: ( ( !logChansConfig ? null : logChansConfig.Default ) || ( !logChansEnv ? null : logChansEnv.Default ) || null ),
          Error: ( ( !logChansConfig ? null : logChansConfig.Error ) || ( !logChansEnv ? null : logChansEnv.Error ) || null ),
          JoinPart: ( ( !logChansConfig ? null : logChansConfig.JoinPart ) || ( !logChansEnv ? null : logChansEnv.JoinPart ) || null )
        },
        Mods: ( config.moderatorIds || [] ),
        Name: ( config.botName || env.BOT_USERNAME ),
        Owner: botOwnerID,
        Prefix: ( config.prefix || '!' ),
        Verbosity: ( env.VERBOSITY || -1 ),
        Version: verBotDB,
        Whitelist: []
      };
      return await botConfig.create( newBotConfig )
      .then( initSuccess => { console.log( chalk.bold.greenBright( 'Bot configuration initialized in my database.' ) ); return newBotConfig; } )
      .catch( initError => { throw new Error( chalk.bold.cyan.inverse( `Error attempting to initialize bot configuration in my database:\n${initError}` ) ); } );
    }
  }
  catch ( errObject ) {
    //const strScript = chalk.hex( '#FFA500' ).bold( getModPath( modData ) );// TEMPORARY --- WILL BE IN ERROR HANDLER LATER
    console.error( 'Uncaught error in %s:\n\t%s', chalk.hex( '#FFA500' ).bold( './functions/getBotDB.js' ), errObject.stack );
  }
};