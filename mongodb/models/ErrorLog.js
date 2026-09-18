const modData = { name: 'ErrorLog', platform: 'mongodb', type: 'models' };
const bot = require( '..' );
const { buildPath, mongoose } = bot;
const { model, Schema } = mongoose;

const errorLogSchema = new Schema( {
  message: { required: true, type: String },
  stack: { required: true, type: String },
  origin: {
    group: { default: '', type: String },
    name: { required: true, type: String },
    platform: { default: '', type: String },
    resolvedPath: { type: String },
    type: { default: '', type: String }
  },
  metadata: {
    default: {},
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true } );

errorLogSchema.pre( 'save', function( next ) {
  if ( this.origin?.name ) {
    const og = this.origin;
    og.resolvedPath = buildPath( { group: og.group, name: og.name, platform: og.platform, type: og.type } );
  }
  next();
} );

module.exports = model( 'ErrorLog', errorLogSchema );