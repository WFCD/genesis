'use strict';

const Handler = require('../models/BaseEventHandler');

const DynamicVoiceHandler = require('./DynamicVoiceHandler');

const { timeDeltaToMinutesString, fromNow } = require('../CommonFunctions');

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
    const vallisState = (await self.bot.worldStates.pc.getData()).vallisCycle;
    const base = `@${self.client.user.username} help`;
    let final = base;
    if (vallisState || cetusState) {
      const vs = vallisState ? `${timeDeltaToMinutesString(fromNow(new Date(vallisState.expiry))) || '??'} to ${vallisState.isWarm ? '❄' : '🔥'} | ` : '';
      const cs = cetusState ? `${timeDeltaToMinutesString(fromNow(new Date(cetusState.expiry))) || '??'} to  ${cetusState.isDay ? '🌙' : '☀'} | ` : '';
      final = `${vs}${cs}${base}`;
    }

    if (cetusState) {
      self.client.user.setPresence({
        status: 'online',
        afk: false,
        game: {
          name: final,
          type: 'WATCHING',
        },
      });
    }
  } catch (error) {
    // swallow, it's not an important error
  }
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
    this.logger.info(`[Shard ${this.bot.shardId}] READY`);
    if (this.bot.controlHook && ((process.env.LOG_LEVEL || 'ERROR').toLowerCase() === 'debug')) {
      await this.bot.controlHook.edit(
        this.bot.client.user.username,
        this.bot.client.user.displayAvatarURL,
      );
      this.bot.controlHook.send({
        embeds: [{
          description: `Shard **${this.bot.shardId + 1}/${this.bot.shardCount}** ready`,
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
    this.bot.dynamicVoiceHandler = new DynamicVoiceHandler(this.client, this.logger, this.settings);
  }
}

module.exports = OnReadyHandle;
