const bot = require( '..' );
const { model, Schema } = bot.mongoose;
const { Snowflake } = Schema.Types;

const botSchema = new Schema( {
  _id: { type: String, default: "DDObot-Live" },
  Name: String,
  Owner: String,
  Platforms: {
    Discord: [ {
      Blacklist: [ { type: Snowflake, platform: "discord" } ],
      ClientId: { type: Snowflake, platform: "discord" },
      DevGuild: { type: Snowflake, platform: "discord" },
      Logs: {
        Default: { type: Snowflake, platform: "discord" },
        Error: { type: Snowflake, platform: "discord" },
        JoinPart: { type: Snowflake, platform: "discord" }
      },
      Mods: [ { type: Snowflake, platform: "discord" } ],
      Prefix: { type: String, default: "!" },
      Username: String,
      Whitelist: [ { type: Snowflake, platform: "discord" } ]
    } ],
    GitHub: [ {
      Branch: String,
      IssueRepo: String,
      Username: String
    } ],
    MediaWiki: [ {
      ApiUrl: String,
      Owner: String,
      Snowflake: { type: Snowflake, platform: "ddoWiki" },
      Username: String,
      WikiName: String
    } ],
    WebDash: {
      Port: { type: Number, default: 3000 },
      SessionSecret: String
    },
    TwitterX: [ {
      UserID: { type: Snowflake, platform: "twitterX" }
    } ]
  },
  Verbosity: { type: Number, default: 5 },
  Version: Number
}, { timestamps: true } );

module.exports = model( 'BotConfig', botSchema );