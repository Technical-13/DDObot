const { model, Schema } = require( 'mongoose' );

let errorLogSchema = new Schema( {
  _id: String,
}, { timestamps: true } );

module.exports = model( 'ErrorLog', errorLogSchema );