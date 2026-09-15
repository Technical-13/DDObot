const modData = { name: 'Snowflake', platform: 'mongodb', type: 'types' };
const bot = require( '..' );
const { chalk, mongoose } = bot;
const PF = {
  ddoWiki: { epoch: 1136073600000n },
  discord: { epoch: 1420070400000n, min: 21154535154122752n },
  twitterX: { epoch: 1288834974657n }
};

class Snowflake extends mongoose.SchemaType {
  constructor( key, options ) {
    if ( !options ) { options = { platform: 'ddoWiki' }; }
    if ( !options.platform ) { options.platform = 'ddoWiki'; }
    super( key, options, 'Snowflake' );
  }

  cast( val ) {
    const platform = this.options.platform;
    try {
      if ( !/^\d{1,25}$/.test( val ) ) { throw new Error( 'Snowflake: "' + chalk.bold( val ) + '" is not a numeric ID string.' ); }
      const P = PF[ platform ];
      if ( !P ) { throw new Error( 'Snowflake: Unknown platform configuration "' + chalk.bold( platform ) + '".' ); }
      const max = ( ( ( BigInt( Date.now() ) - P.epoch ) << 22n ) | 0x3FFFFFn );
      const min = ( P.min || 0n );
      const bintSF = BigInt( val );
      if ( min <= bintSF && bintSF <= max ) { return val; }
      throw new Error( 'Snowflake: "' + val + '" is not a valid ' + chalk.bold( platform ) + ' snowflake.' );
    }
    catch ( e ) {
      throw new mongoose.Error.CastError( 'Snowflake', val, this.path, new Error( e.message ) );
    }
  }
}

mongoose.Schema.Types.Snowflake = Snowflake;