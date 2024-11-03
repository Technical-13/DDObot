const client = require( '..' );
const { OAuth2Scopes, PermissionFlagsBits } = require( 'discord.js' );
const chalk = require( 'chalk' );
const config = require( '../config.json' );
const guildConfig = require( '../models/GuildConfig.js' );
const userConfig = require( '../models/BotUser.js' );
const getGuildConfig = require( '../functions/getGuildDB.js' );
const createNewGuild = require( '../functions/createNewGuild.js' );
const createNewUser = require( '../functions/createNewUser.js' );
const addUserGuild = require( '../functions/addUserGuild.js' );
const getBotConfig = require( '../functions/getBotDB.js' );
const duration = require( '../functions/duration.js' );
const parse = require( '../functions/parser.js' );
const verGuildDB = config.verGuildDB;
const verUserDB = config.verUserDB;

client.on( 'ready', async rdy => {
  try {
    const botOwner = client.users.cache.get( client.ownerId );
    const activityTypes = { 'Playing': 0, 'Streaming': 1, 'Listening': 2, 'Watching': 3, 'Custom': 4, 'Competing': 5 };
    const inviteUrl = client.generateInvite( {
      permissions: [
        PermissionFlagsBits.CreateInstantInvite,
        PermissionFlagsBits.Administrator,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.ManageWebhooks,
        PermissionFlagsBits.UseApplicationCommands
      ],
      scopes: [
        OAuth2Scopes.Bot,
        OAuth2Scopes.ApplicationsCommands
      ],
    } );
    await client.user.setPresence( { activities: [ { type: activityTypes.Custom, name: '🥱 Just waking up...' } ], status: 'dnd' } );

    const today = ( new Date() );
    const objTimeString = {"hour":"2-digit","hourCycle":"h24","minute":"2-digit","second":"2-digit","timeZone":"America/New_York","timeZoneName":"short"};
    const botTime = today.toLocaleTimeString( 'en-US', objTimeString );
    console.log( chalk.bold( `The bot owner's local time is ${botTime}.` ) );
    const hour = parseInt( botTime.split( ':' )[ 0 ] );
    const myTime = ( hour >= 5 && hour < 12 ? 'morning' : ( hour >= 12 && hour < 18 ? 'afternoon' : ( hour >= 18 && hour < 23 ? 'evening' : 'nighttime' ) ) );
    const myCup = ( hour >= 5 && hour < 12 ? 'my ' : ( hour >= 12 && hour < 18 ? 'an ' : 'a ' ) ) + myTime;
    setTimeout( async () => { await client.user.setPresence( { activities: [ { type: activityTypes.Watching, name: 'my ' + myTime + ' coffee brew...' } ], status: 'dnd' } ); }, 15000 );
    setTimeout( async () => { await client.user.setPresence( { activities: [ { type: activityTypes.Custom, name: 'Drinking ' + myCup + ' cup of ☕' } ], status: 'idle' } ); }, 60000 );
    const firstActivity = config.activities[ 0 ];
    setTimeout( async () => { await client.user.setPresence( { activities: [ { type: activityTypes[ firstActivity.type ], name: firstActivity.name } ], status: 'online' } ); }, 180000 );

    const servingGuilds = [ { type: 'Custom', name: 'Watching {{bot.servers}} servers.' } ];
    const servingUsers = [ { type: 'Custom', name: 'Listening to {{bot.users}} members.' } ];
    const botUptime = [ { type: 'Custom', name: 'Uptime: {{bot.uptime}}' } ];
    const cycleActivities = [].concat( config.activities, servingGuilds, servingUsers, botUptime );
    const intActivities = cycleActivities.length;
    var iAct = 1;
    setInterval( async () => {
      let activityIndex = ( iAct++ % intActivities );
      let thisActivity = cycleActivities[ activityIndex ];
      let actType = activityTypes[ thisActivity.type ];
      let actName = await parse( thisActivity.name, { uptime: { getWeeks: true } } );
      await client.user.setPresence( { activities: [ { type: actType, name: actName } ], status: 'online' } );
    }, 300000 );
    console.log( chalk.bold.magentaBright( `Successfully logged in as: ${client.user.tag}` ) );

    const dbExpires = new Date( ( new Date() ).setMonth( ( new Date() ).getMonth() + 1 ) );
    const botGuildIds = Array.from( client.guilds.cache.keys() );
    const storedGuilds = await guildConfig.find();
    const storedGuildIds = [];
    storedGuilds.forEach( ( entry, i ) => { storedGuildIds.push( entry._id ); } );
    let addedGuilds = await botGuildIds.filter( a => !storedGuildIds.includes( a ) );
    if ( addedGuilds.length > 0 ) {
      console.log( 'Adding %s new guild%s: %o', chalk.greenBright( addedGuilds.length ), ( addedGuilds.length === 1 ? '' : 's' ), addedGuilds );
      addedGuilds.forEach( ( guildId ) => { botGuildIds.push( guildId ); } );
    }
    let removedGuilds = await storedGuildIds.filter( r => !botGuildIds.includes( r ) );
    if ( removedGuilds.length > 0 ) {
      console.log( 'Checking %s lost guild%s: %o', chalk.redBright( removedGuilds.length ), ( removedGuilds.length === 1 ? '' : 's' ), removedGuilds );
      removedGuilds.forEach( async ( guildId ) => { botGuildIds.push( guildId ); } );
    }
    let updateGuildList = [].concat( addedGuilds, removedGuilds );
    if ( botGuildIds.length > 0 ) { console.log( 'Checking %s guild%s...', chalk.blueBright( botGuildIds.length ), ( botGuildIds.length === 1 ? '' : 's' ) ); }
    await botGuildIds.forEach( async ( guildId ) => {// Update guilds I'm still in.
      let guild = await client.guilds.cache.get( guildId );
      if ( !guild ) { return; }
      if ( await guildConfig.countDocuments( { _id: guildId } ) === 0 ) { await createNewGuild( guild ); }
      let currGuildConfig = await getGuildConfig( guild );
      let guildOwner = guild.members.cache.get( guild.ownerId );
      let clearExpiration = ( currGuildConfig.Expires && guild ? true : false );
      let newName = ( guild.name !== currGuildConfig.Guild.Name ? true : false );
      let newOwnerID = ( guild.ownerId !== currGuildConfig.Guild.OwnerID ? true : false );
      let newOwnerName = ( guildOwner.displayName !== currGuildConfig.Guild.OwnerName ? true : false );
      let newSize = ( guild.members.cache.size !== currGuildConfig.Guild.Members ? true : false );
      let newVersion = ( verGuildDB !== currGuildConfig.Version ? true : false );
      var updateGuildVersion = null;
      var doGuildUpdate = false;
      if ( clearExpiration ) {// Clear expiration date because I'm in the guild!
        currGuildConfig.Expires = null;
        doGuildUpdate = true;
      }
      if ( newName ) {// Update guild name
        currGuildConfig.Guild.Name = guild.name;
        doGuildUpdate = true;
      }
      if ( newOwnerID ) {// Update guild owner id
        currGuildConfig.Guild.OwnerID = guild.ownerId;
        doGuildUpdate = true;
      }
      if ( newOwnerName ) {// Update guild owner displayName
        currGuildConfig.Guild.OwnerName = guild.displayName;
        doGuildUpdate = true;
      }
      if ( newSize ) {// Update guild size
        currGuildConfig.Guild.Members = guild.members.cache.size;
        doGuildUpdate = true;
      }
      if ( newVersion ) {// Update everything
        const botConfig = await getBotConfig();
        const logClosing = ( defaultId ) => { return '\n' + ( defaultId == null ? '\nPlease run `/config logs` to have these logs go to a channel in the [' + guild.name + '](<https://discord.com/channels/' + guild.id + '>) server or deactivate them instead of to your DMs.' : '\n----' ); }
        let Blacklist = ( currGuildConfig.Blacklist || { Members: [], Roles: [] } );
        let Logs = ( currGuildConfig.Logs || { Active: true, Chat: null, Default: null, Error: null, strClosing: logClosing( null ) } );
        let Part = ( currGuildConfig.Part || { Active: false, Channel: null, Message: null, SaveRoles: false } );
        let Welcome = ( currGuildConfig.Welcome || { Active: false, Channel: null, Message: null, Role: null } );
        let Whitelist = ( currGuildConfig.Whitelist || { Members: [], Roles: [] } );
        updateGuildVersion = {
          _id: guild.id,
          Bans: ( currGuildConfig.Bans || [] ),
          Blacklist: {
            Members: ( Blacklist.Members || [] ),
            Roles: ( Blacklist.Roles || [] )
          },
          Commands: ( currGuildConfig.Commands || [] ),
          Expires: ( currGuildConfig.Expires || null ),
          Guild: {
            Name: guild.name,
            Members: guild.members.cache.size,
            OwnerID: guild.ownerId,
            OwnerName: guildOwner.displayName
          },
          Invite: ( currGuildConfig.Invite || null ),
          Logs: {
            Active: ( Logs.Active || true ),
            Chat: ( Logs.Chat || null ),
            Default: ( Logs.Default || null ),
            Error: ( Logs.Error || null ),
            strClosing: ( Logs.strClosing || logClosing( null ) )
          },
          Part: {
            Active: ( Part.Active || false ),
            Channel: ( Part.Channel || null ),
            Message: ( Part.Message || null ),
            SaveRoles: ( Part.SaveRoles || false )
          },
          Prefix: ( currGuildConfig.Prefix || botConfig.Prefix ),
          Premium: ( currGuildConfig.Premium || true ),
          Version: verGuildDB,
          Welcome: {
            Active: ( Welcome.Active || false ),
            Channel: ( Welcome.Channel || null ),
            Message: ( Welcome.Message || null ),
            Role: ( Welcome.Role || null )
          },
          Whitelist: {
            Members: ( Whitelist.Members || [] ),
            Roles: ( Whitelist.Roles || [] )
          }
        };
        doGuildUpdate = true;
      }
      if ( doGuildUpdate ) {// Something changed offline
        updateGuildList.push( chalk.bold.cyan( guild.name) );
        await guildConfig.updateOne( { _id: guildId }, ( updateGuildVersion || currGuildConfig ), { upsert: true } )
        .then( updateSuccess => { console.log( 'Succesfully updated guild id: %s (%s) in my database.', guildId, chalk.bold.green( guild.name ) ); } )
        .catch( updateError => { throw new Error( chalk.bold.red.bgYellowBright( `Error attempting to update ${guild.name} (id: ${guildId}) to my database:\n${updateError}` ) ); } );
      }
    } );
    if ( updateGuildList.length === 0 ) { console.log( chalk.bold.greenBright( 'My guilds match my database!' ) ); }
    else { console.log( 'Updating %s guild%s: %o', chalk.yellow( updateGuildList.length ), ( updateGuildList.length === 1 ? '' :  's' ), updateGuildList ); }
    if ( removedGuilds.length !== 0 ) {// Update/Delete guilds I'm no longer in.
      console.log( 'Checking to see if guild data for %s guild%s has expired...', chalk.blueBright( removedGuilds.length ), ( removedGuilds.length === 1 ? '' : 's' ) );
      removedGuilds.forEach( async ( guildId ) => {
        let delGuild = storedGuilds.find( entry => entry.id === guildId );
        let isExpired = ( !delGuild.Expires ? false : ( delGuild.Expires <= ( new Date() ) ? true : false ) );
        if ( isExpired ) {
          let guildOwner = ( client.users.cache.get( delGuild.Guild.OwnerID ) || null );
          let ownerName = ( guildOwner ? '<@' + guildOwner.id + '>' : '`' + delGuild.Guild.OwnerName + '`' );
          console.log( 'Deleting expired guild id: %s (%s)...', guildId, chalk.bold.red( delGuild.Guild.Name ) );
          await guildConfig.deleteOne( { _id: guildId } )
          .then( delExpired => {
            console.log( 'Succesfully deleted expired id: %s (%s) from my database.', guildId, chalk.bold.red( delGuild.Guild.Name ) );
            if ( guildOwner ) {
              guildOwner.send( { content: 'Hello! It has been a month since someone has removed me from [' + delGuild.Guild.Name + '](<https://discord.com/channels/' + guildId + '>), and I\'ve cleaned out your configuration settings!\n\nYou can still get me back in your server at any time by [re-adding](<' + inviteUrl + '>) me.' } )
              .catch( errSendDM => {
                console.error( 'errSendDM: %s', errSendDM.stack );
                botOwner.send( { content: 'Failed to DM ' + ownerName + ' to notify them that I cleaned the guild, [' + delGuild.Guild.Name + '](<https://discord.com/channels/' + guildId + '>), from my database.' } );
              } );
            }
            else {
              botOwner.send( { content: 'Unable to find ' + ownerName + ' to notify them that I cleaned the guild, [' + delGuild.Guild.Name + '](<https://discord.com/channels/' + guildId + '>), from my database.' } );
            }
          } )
          .catch( errDelete => { throw new Error( chalk.bold.red.bgYellowBright( `Error attempting to delete ${delGuild.Guild.Name} (id: ${guildId}) from my database:\n${errDelete.stack}` ) ); } );
        }
        else if ( !delGuild.Expires ) {
          delGuild.Expires = dbExpires;
          console.log( 'I was removed from %s while I was offline, so I have set guild to expire: %o', chalk.hex( '#FFA500' ).bold( delGuild.Guild.Name ), delGuild.Expires );
          await guildConfig.updateOne( { _id: guildId }, delGuild, { upsert: true } )
          .then( updateSuccess => { console.log( 'Succesfully updated guild id: %s (%s) in my database.', guildId, chalk.bold.green( delGuild.Guild.Name ) ); } )
          .catch( updateError => { throw new Error( chalk.bold.red.bgYellowBright( `Error attempting to update ${delGuild.Guild.Name} (id: ${guildId}) to my database:\n${updateError}` ) ); } );
        }
        else { console.log( 'Guild %s expires: %o', chalk.hex( '#FFA500' ).bold( delGuild.Guild.Name ), delGuild.Expires ); }
      } );
    }

    const botUserIds = Array.from( client.users.cache.keys() );
    const storedUsers = await userConfig.find();
    const storedUserIds = [];
    storedUsers.forEach( ( entry, i ) => { storedUserIds.push( entry._id ); } );
    let addedUsers = await botUserIds.filter( a => !storedUserIds.includes( a ) );
    if ( addedUsers.length > 0 ) {
      console.log( 'Adding %s new user%s: %o', chalk.greenBright( addedUsers.length ), ( addedUsers.length === 1 ? '' : 's' ), addedUsers );
      addedUsers.forEach( ( userId ) => { botUserIds.push( userId ); } );
    }
    let removedUsers = await storedUserIds.filter( r => !botUserIds.includes( r ) );
    if ( removedUsers.length > 0 ) {
      console.log( 'Checking %s lost user%s: %o', chalk.redBright( removedUsers.length ), ( removedUsers.length === 1 ? '' : 's' ), removedUsers );
      removedUsers.forEach( async ( userId ) => { botUserIds.push( userId ); } );
    }
    let updateUserList = [];
    if ( botUserIds.length > 0 ) { console.log( 'Checking on %s user%s...', chalk.blueBright( botUserIds.length ), ( botUserIds.length === 1 ? '' : 's' ) ); }
    new Promise( async ( resolve, reject ) => {
      await botUserIds.forEach( async ( userId ) => {// Add new users and update all users in database.
        new Promise( async ( resolve, reject ) => {
          let user = client.users.cache.get( userId );
          if ( await userConfig.countDocuments( { _id: userId } ) === 0 ) { await createNewUser( user ); }
          let botUserGuilds = ( Array.from( client.guilds.cache.filter( g => g.members.cache.has( userId ) ).keys() ).toSorted() || [] );
          let currUser = await userConfig.findOne( { _id: userId } );
          let storedUserGuilds = [];
          currUser.Guilds.forEach( ( entry, i ) => { storedUserGuilds.push( entry._id ); } );
          let addedGuilds = botUserGuilds.filter( a => !storedUserGuilds.includes( a ) );
          let removedGuilds = storedUserGuilds.filter( r => !botUserGuilds.includes( r ) );
          let newName = ( !user ? false : ( user.displayName != currUser.UserName ? true : false ) );
          let newGuilds = ( [].concat( addedGuilds, removedGuilds ).length > 0 ? true : false );
          let newVersion = ( verUserDB != currUser.Version ? true : false );
          var updateUserVersion = null;
          var doUserUpdate = false;
          if ( newName ) {// Update user displayName
            currUser.UserName = user.displayName;
            doUserUpdate = true;
          }
          if ( newGuilds ) {// Update guilds
            if ( addedGuilds.length > 0 ) {// Added guild(s)
              await addedGuilds.forEach( async ( guildId ) => {
                let guild = await client.guilds.cache.get( guildId );
                await addUserGuild( userId, guild );
              } );
            }
            if ( removedGuilds.length > 0 ) {// Removed guild(s)
              removedGuilds.forEach( async ( guildId, i ) => {
                let currUserGuild = currUser.Guilds[ i ];
                if ( Object.prototype.toString.call( currUserGuild.Expires ) != '[object Date]' ) {
                  console.log( 'Marking guild %s (%s) to expire for %s (%s) in %s on: %o', guildId, chalk.red( currUserGuild.GuildName ), currUser._id, chalk.red( currUser.UserName ), chalk.bold.redBright( await duration( dbExpires - ( new Date() ), { getWeeks: true } ) ), dbExpires );
                  currUserGuild.Expires = dbExpires;
                  doUserUpdate = true;
                }
                else if ( currUserGuild.Expires <= ( new Date() ) ) {
                  console.log( 'Removing expired guild %s (%s) from %s (%s) on: %o', guildId, currUserGuild.Name, currUser._id, currUser.UserName, dbExpires );
                  currUser.Guilds.splice( i, 1 );
                  doUserUpdate = true;
                }
                else { console.log( 'Guild %s (%s) expires from %s (%s) in %s on: %o', guildId, chalk.red( currUserGuild.GuildName ), currUser._id, chalk.red( currUser.UserName ), chalk.bold.redBright( await duration( currUserGuild.Expires - ( new Date() ), { getWeeks: true } ) ), currUserGuild.Expires ); }
              } );
              if ( currUser.Guilds.length === 0 && !currUser.Guildless ) {
                console.log( 'User %s (%s) no longer shares any guild with me.', userId, chalk.redBright( currUser.UserName ) );
                currUser.Guildless = dbExpires;
                doUserUpdate = true;
              }
            }
          }
          if ( newVersion ) {// Update everything
            let Guilds = null;
            updateUserVersion = {
              _id: ( user ? user.id : currUser._id ),
              Bot: ( ( user ? user.bot : currUser.Bot ) ? true : false ),
              Guilds: ( currUser.Guilds || [] ),
              Guildless: ( currUser.Guildless || null ),
              UserName: ( currUser.UserName || ( user ? user.displayName : null ) ),
              Score: ( currUser.Score || 0 ),
              Version: verUserDB
            };
            doUserUpdate = true;
          }
          resolve( !doUserUpdate ? doUserUpdate : ( updateUserVersion || currUser ) );
        } )
        .then( async ( updatedUser ) => {
          if ( updatedUser ) {
            updateUserList.push( chalk.bold.cyan( !user ? updatedUser.UserName : user.displayName ) );
            await userConfig.updateOne( { _id: userId }, updatedUser, { upsert: true } )
            .then( updateSuccess => { console.log( 'Succesfully updated user id: %s (%s) in my database.', userId, chalk.bold.green( updatedUser.UserName ) ); } )
            .catch( updateError => { throw new Error( chalk.bold.red.bgYellowBright( `Error attempting to update user ${updatedUser.UserName} (id: ${userId}) in my database:\n${updateError}` ) ); } );
          }
        } );
      } );
      resolve( updateUserList );
    } )
    .then( ( updateUserList ) => {
      if ( updateUserList.length === 0 ) { console.log( chalk.bold.greenBright( 'My users match my database!' ) ); }
      else { console.log( 'I updated %s user%s in my database!', chalk.bold.yellow( updateUserList.length ), ( updateUserList.length === 1 ? '' : 's' ) ); }
    } );

  }
  catch ( errObject ) { console.error( 'Uncaught error in %s: %s', chalk.hex( '#FFA500' ).bold( 'ready.js' ), errObject.stack ); }
} );