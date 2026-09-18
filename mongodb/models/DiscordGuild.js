const modData = { name: 'DiscordGuild', platform: 'mongodb', type: 'models' };
const bot = require( '..' );
const { model, Schema } = bot.mongoose;
const { Snowflake } = Schema.Types;

const guildSchema = new Schema( {
  _id: String,
  Name: String,
  Members: Number,
  OwnerID: { type: Snowflake, platform: "discord" },
  OwnerName: String,
  Bans: [ {
    _id: String,
    BanBy: {
      ID: { type: Snowflake, platform: "discord" },
      Name: String
    },
    Expires: Date
  } ],
  Blacklist: {
    Members: [ { type: Snowflake, platform: "discord" } ],
    Roles: [ { type: Snowflake, platform: "discord" } ]
  },
  BotBumpers: {
    DISBOARD: {
      ChannelId: { type: Snowflake, platform: "discord" },
      Enabled: Boolean,
      LastBumpAt: Date,
      LastBumpBy: { type: Snowflake, platform: "discord" },
      RoleId: { type: Snowflake, platform: "discord" }
    },
    DiscordMe: {
      ChannelId: { type: Snowflake, platform: "discord" },
      Enabled: Boolean,
      LastBumpAt: Date,
      LastBumpBy: { type: Snowflake, platform: "discord" },
      RoleId: { type: Snowflake, platform: "discord" }
    },
    DiscordServers: {
      ChannelId: { type: Snowflake, platform: "discord" },
      Enabled: Boolean,
      LastBumpAt: Date,
      LastBumpBy: { type: Snowflake, platform: "discord" },
      RoleId: { type: Snowflake, platform: "discord" }
    }
  },
  Commands: [ String ],
  Expires: Date,
  Invite: String,
  Logs: {
    Active: Boolean,
    Chat: { type: Snowflake, platform: "discord" },
    Default: { type: Snowflake, platform: "discord" },
    Error: { type: Snowflake, platform: "discord" },
    JoinPart: { type: Snowflake, platform: "discord" }
  },
  Part: {
    Active: Boolean,
    Channel: { type: Snowflake, platform: "discord" },
    Message: String,
    SaveRoles: Boolean
  },
  Prefix: String,
  Premium: Boolean,
  Version: Number,
  Welcome: {
    Active: Boolean,
    Channel: { type: Snowflake, platform: "discord" },
    Message: String,
    Role: { type: Snowflake, platform: "discord" }
  },
  Whitelist: {
    Members: [ { type: Snowflake, platform: "discord" } ],
    Roles: [ { type: Snowflake, platform: "discord" } ]
  }
}, { timestamps: true } );

module.exports = model( 'DiscordGuild', guildSchema );