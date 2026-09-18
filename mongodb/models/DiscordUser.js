const modData = { name: 'DiscordUser', platform: 'mongodb', type: 'models' };
const bot = require( '..' );
const { model, Schema } = bot.mongoose;
const { Snowflake } = Schema.Types;

const userSchema = new Schema( {
  _id: String,
  Bot: Boolean,
  Guilds: [ {
    _id: String,
    Corrections: [ {
      ByID: String,
      ByName: String,
      Duration: String,
      StartedAt: Date,
      Type: String
    } ],
    Expires: Date,
    GuildName: String,
    MemberName: String,
    Roles: [ String ],
    Score: Number
  } ],
  Guildless: Date,
  Score: Number,
  UserName: String,
  Version: Number
}, { timestamps: true } );

module.exports = model( 'DiscordUser', userSchema );