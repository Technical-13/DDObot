const bot = require( '..' );
const { buildPath, chalk, config, timeFormat, utils } = bot;
const { duration } = utils;
const modData = buildPath( { name: 'parser', platform: 'discord', type: 'functions' } );

const getTransclusion = ( A, L ) => {
  if ( A?.constructor.name !== 'Object' || !L || typeof L !== 'string' ) { return undefined; }
  L = L// substitute in aliases, then chop the braces:
    .replace( /server/g, 'guild' )
    .slice( 2, -2 );
  const arrL = L.split( '.' ).filter( Boolean );
  const R = arrL.reduce( ( d, k ) => d?.constructor.name !== 'Object' ? d : d[ k ], A );
  if ( R?.constructor.name === 'Object' ) { return undefined; }
  return R;
};

module.exports = async ( client, rawString, obj = {} ) => {
  try {
    if ( !rawString ) { throw new Error( modData.path + ' received no string to parse.' ); }
    if ( obj?.constructor.name !== 'Object' ) {
      throw new Error( modData.path + ' received an invalid third parameter of type "' + obj.constructor.name + '" instead of "Object".' );
    }
    const author = obj.author;
    const member = obj.member;
    const guild = obj.guild ?? author?.guild ?? member?.guild;
    const uptime = obj.uptime;
    const ageUnits = { getXs: true, getYrs: true, getMos: true, getWks: true, getDays: true, getHrs: false, getMins: false };
    const ego = client.user;

    const currUptime = await duration( client.uptime, uptime );

    const transclusions = {
      author: author ? {// age, guild: { age }, name, member: { since }, ping, since, user: { since } } : false,
        age: await duration( Date.now() - author.user.createdTimestamp, ageUnits ),
        guild: {// age },
          age: await duration( Date.now() - author.joinedTimestamp, ageUnits )
        },
        name: author.displayName,
        member: {// since },
          since: guild.members.cache.get( author.id ).joinedAt.toLocaleTimeString( 'en-US', timeFormat )
        },
        ping: '<@' + author.id + '>',
        since: author.user.createdAt.toLocaleTimeString( 'en-US', timeFormat ),
        user: {// since },
          since: author.user.createdAt.toLocaleTimeString( 'en-US', timeFormat )
        }
      } : false,
      bot: {// age, guild: { age, since }, guilds, latency, member: { age, since }, members, name, owner: { name, ping }, ping, since, users, uptime },
        age: await duration( Date.now() - ego.createdTimestamp, ageUnits ),
        guild: guild ? {// age, since } : false,
          age: await duration( Date.now() - guild.members.cache.get( ego.id ).joinedTimestamp, ageUnits ),
          since: guild.members.cache.get( ego.id ).joinedAt.toLocaleTimeString( 'en-US', timeFormat )
        } : false,
        guilds: client.guilds.cache.size.toLocaleString(),
        latency: client.ws.ping,
        member: guild ? {// age, since } : false,
          age: await duration( Date.now() - guild.members.cache.get( ego.id ).joinedTimestamp, ageUnits ),
          since: guild.members.cache.get( ego.id ).joinedAt.toLocaleTimeString( 'en-US', timeFormat )
        } : false,
        members: client.users.cache.size.toLocaleString(),
        name: ego.displayName,
        owner: {// name, ping },
          name: client.users.cache.get( client.ownerId ).displayName,
          ping: '<@' + client.ownerId + '>'
        },
        ping: '<@' + client.id + '>',
        since: ego.createdAt.toLocaleTimeString( 'en-US', timeFormat ),
        users: client.users.cache.size.toLocaleString(),
        uptime: currUptime
      },
      guild: guild ? {// age, bot: { age, since }, owner: { name, ping }, member: { age, since }, members, name, since } : false,
        age: await duration( Date.now() - guild.createdTimestamp, ageUnits ),
        owner: {// name, ping },
          name: guild.members.cache.get( guild.ownerId ).displayName,
          ping: '<@' + guild.ownerId + '>'
        },
        members: guild.members.cache.size.toLocaleString(),
        name: guild.name,
        since: guild.createdAt.toLocaleTimeString( 'en-US', timeFormat )
      } : false,
      member: member ? {// age, guild: { age }, name, ping, since, user: { since } : false
        age: await duration( Date.now() - member.user.createdTimestamp, ageUnits ),
        guild: {// age },
          age: await duration( Date.now() - member.joinedTimestamp, ageUnits )
        },
        name: member.displayName,
        ping: '<@' + member.id + '>',
        since: guild.members.cache.get( member.id ).joinedAt.toLocaleTimeString( 'en-US', timeFormat ),
        user: {// since }
          since: member.user.createdAt.toLocaleTimeString( 'en-US', timeFormat )
        }
      } : false
    };

    const arrTemplates = rawString.match( /\{\{((?:author|bot|guild|member|server)\.[a-z\.]*)\}\}/g );
    let parsed = rawString;
    if ( arrTemplates ) {
      arrTemplates.forEach( template => {
        const transclusion = getTransclusion( transclusions, template );
        if ( transclusion ) { parsed = parsed.replace( template, transclusion ); }
        else {
          parsed = parsed.replace( template, '[*`' + template + '`*](<' + config.issueRepo + '/issues/new?labels=enhancement&template=feature_request.md&title=' + encodeURI( 'Please add `' + template + '` to `' + modData.path ) + '`>)' );
          console.log( 'Someone tried to transclude %s, search for a GitHub feature request:\n %s/issues?q=%s', chalk.bold.red( template ), config.issueRepo, encodeURI( 'Please add ' + template + ' to ' + modData.path ) );
        }
      } );
    }

    return parsed;
  }
  catch ( errObject ) { console.error( 'Uncaught error in %s:\n\t%s', modData.path, errObject.stack ); }
};