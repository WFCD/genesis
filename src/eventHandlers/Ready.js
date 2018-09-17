'use strict';

const SQL = require('sql-template-strings');
const Handler = require('../models/BaseEventHandler');

/**
 * Check if private rooms have expired and are empty. If not, do nothing.
 * If so, delete the corresponding channels.
 * @param  {Genesis} self    Bot instance
 * @param  {number} shardId shard identifier
 */
async function checkPrivateRooms(self, shardId) {
  self.logger.debug(`Checking private rooms... Shard ${shardId}`);
  const privateRooms = await self.settings.getPrivateRooms();
  self.logger.debug(`Private rooms... ${privateRooms.length}`);
  privateRooms.forEach(async (room) => {
    if (room && (room.textChannel || room.category || room.voiceChannel)) {
      const now = new Date();
      if (((now.getTime() + (now.getTimezoneOffset() * 60000)) - room.createdAt
          > self.channelTimeout)
        && (!room.voiceChannel || room.voiceChannel.members.size === 0)) {
        if (room.textChannel && room.textChannel.deletable) {
          self.logger.debug(`Deleting text channel... ${room.textChannel.id}`);
          await room.textChannel.delete();
        }
        if (room.voiceChannel && room.voiceChannel.deletable) {
          self.logger.debug(`Deleting voice channel... ${room.voiceChannel.id}`);
          await room.voiceChannel.delete();
        }
        if (room.category && room.category.deletable) {
          self.logger.debug(`Deleting category... ${room.category.id}`);
          await room.category.delete();
        }
        self.settings.deletePrivateRoom(room);
      }
    } else if (room) {
      await self.settings.deletePrivateRoom({
        textChannel: room.textId ? { id: room.textId } : undefined,
        voiceChannel: { id: room.voiceId },
        category: { id: room.categoryId },
        guild: { id: room.guildId },
      });
    }
  });
}

/**
 * Perform actions when the bot is ready
 * @param {Bot} self  the bot
 */
async function updatePresence(self) {
  try {
    const cetusState = (await self.bot.worldStates.pc.getData()).cetusCycle;
    if (cetusState) {
      self.client.user.setPresence({
        status: 'online',
        afk: false,
        game: {
          name: `${cetusState.shortString} | @${self.client.user.username} help`,
          type: 'WATCHING',
        },
      });
    }
  } catch (error) {
    // swallow, it's not an important error
  }
}

let guildCheck = null; // I don't know where to put this

/**
 * Sends a DM to the owners of all guilds over the ratio
 * @param {Bot} self the bot
 */
async function guildLeave(self) {
  const [results] = await self.settings.db.query(SQL`SELECT * FROM guild_ratio WHERE shard_id = ${self.client.shard.id};`);
  const guilds = results.slice(0, 5);
  const owners = {};
  guilds.forEach((row) => {
    if (owners[row.owner_id]) {
      owners[row.owner_id].message += `, **${self.client.guilds.get(row.guild_id).name}**`;
      owners[row.owner_id].guilds.push(row.guild_id);
    } else {
      owners[row.owner_id] = {
        message: `**${self.client.guilds.get(row.guild_id).name}**`,
        guilds: [row.guild_id],
      };
    }
  });
  Object.keys(owners).forEach(async (id) => {
    const user = await self.client.fetchUser(id, true);
    const DM = await user.createDM();
    if (owners[id].guilds.length > 1) {
      await DM.send(`Your guilds ${owners[id].message} are over the bot-to-user ratio. Genesis will now leave. If you want to keep using Genesis please invite more people or kick some bots.`);
    } else await DM.send(`Your guild ${owners[id].message} is over the bot-to-user ratio. Genesis will now leave. If you want to keep using Genesis please invite more people or kick some bots.`);
    owners[id].guilds.forEach(guild => self.client.guilds.get(guild).leave());
  });
  if ((results.length - 5) <= 0) {
    self.logger.debug('No more guilds in "guild_ratio" clearing interval.');
    clearInterval(guildCheck);
  }
}

/**
 * Checks the ratio of all guilds on the shard
 * @param {Bot} self the bot
 */
function guildRatioCheck(self) {
  const guilds = self.client.guilds.filter((guild) => {
    self.logger.debug(`Checking Guild: ${guild.name} (${guild.id}) Owner: ${guild.ownerID}`);
    const bots = guild.members.filter(user => user.user.bot);
    return ((bots.size / guild.memberCount) * 100) >= 80;
  });

  guilds.forEach((guild) => {
    self.settings.db.query(SQL`INSERT IGNORE INTO guild_ratio (shard_id, guild_id, owner_id)  
    VALUES (${self.client.shard.id}, ${guild.id}, ${guild.ownerID});`);
  });

  guildCheck = setInterval(guildLeave, 10000, self);
}

/**
 * Describes a handler
 */
class OnReadyHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'onReady', 'onReady');
    this.channelTimeout = 60000;
  }

  /**
   * Run the ready handle
   */
  async execute() {
    this.logger.debug(`Running ${this.id} for ${this.event}`);
    if (this.bot.controlHook) {
      await this.bot.controlHook.edit(
        this.bot.client.user.username,
        this.bot.client.user.displayAvatarURL,
      );
      this.bot.controlHook.send({
        embeds: [{
          description: `Shard **${this.bot.client.shard.id + 1}/${this.bot.client.shard.count}** ready`,
          color: 0x2B90EC,
        }],
      });
    }
    this.client.user.setPresence({
      status: 'online',
      afk: false,
      game: {
        name: `@${this.client.user.username} help`,
        url: 'https://genesis.warframestat.us',
      },
    });
    await this.settings.ensureData(this.client);
    this.bot.readyToExecute = true;

    const self = this;
    setInterval(checkPrivateRooms, self.channelTimeout, self, self.bot.shardId);

    setInterval(updatePresence, 60000, self);

    guildRatioCheck(self);
  }
}

module.exports = OnReadyHandle;
